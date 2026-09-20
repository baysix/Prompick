package com.prompick.credit.app;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.credit.domain.*;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 프롬비를 넣고 뺀다.
 *
 * <p>잔액이 바뀌는 길은 여기 하나뿐이고, 여기를 지나가면 거래가 반드시 한 줄 남는다. 잔액만
 * 고치고 기록을 남기지 않는 경로가 하나라도 있으면 장부와 잔액이 어긋나기 시작하고, 그 뒤로는
 * 둘 중 무엇이 맞는지 아무도 모르게 된다.
 *
 * <p>차감할 때는 행을 잠그고 읽는다. 같은 사람이 두 창에서 동시에 제작을 누르면, 잠그지 않은
 * 경우 둘 다 잔액을 확인하고 둘 다 통과해서 100원짜리 지갑으로 200원을 쓰게 된다.
 */
@Service
public class CreditService {

    private static final Logger log = LoggerFactory.getLogger(CreditService.class);

    private final CreditAccountRepository accounts;
    private final CreditTransactionRepository transactions;

    public CreditService(CreditAccountRepository accounts, CreditTransactionRepository transactions) {
        this.accounts = accounts;
        this.transactions = transactions;
    }

    @Transactional(readOnly = true)
    public int balanceOf(Long userId) {
        return accounts.findById(userId).map(CreditAccount::getBalance).orElse(0);
    }

    @Transactional(readOnly = true)
    public CreditAccount accountOf(Long userId) {
        return accounts.findById(userId).orElseGet(() -> new CreditAccount(userId));
    }

    @Transactional(readOnly = true)
    public List<CreditTransaction> historyOf(Long userId, int size) {
        return transactions.findByUserIdOrderByIdDesc(userId, PageRequest.of(0, size));
    }

    /**
     * 프롬비를 쓴다.
     *
     * @throws ApiException 잔액이 모자라면
     */
    @Transactional
    public CreditTransaction spend(
            Long userId, int amount, CreditReason reason, String refType, Long refId) {

        if (amount <= 0) {
            throw new IllegalArgumentException("쓰는 양은 양수여야 합니다");
        }
        return move(userId, -amount, reason, refType, refId, null, null);
    }

    /** 프롬비를 넣는다. 충전·환불·관리자 지급이 모두 이 길로 온다 */
    @Transactional
    public CreditTransaction give(
            Long userId,
            int amount,
            CreditReason reason,
            String refType,
            Long refId,
            String actor,
            String memo) {

        if (amount <= 0) {
            throw new IllegalArgumentException("주는 양은 양수여야 합니다");
        }
        return move(userId, amount, reason, refType, refId, actor, memo);
    }

    /** 관리자가 회수한다. 잘못 지급했거나 부정 사용이 확인됐을 때 */
    @Transactional
    public CreditTransaction revoke(Long userId, int amount, String actor, String memo) {
        if (amount <= 0) {
            throw new IllegalArgumentException("회수하는 양은 양수여야 합니다");
        }
        return move(userId, -amount, CreditReason.ADMIN_REVOKE, null, null, actor, memo);
    }

    private CreditTransaction move(
            Long userId,
            int amount,
            CreditReason reason,
            String refType,
            Long refId,
            String actor,
            String memo) {

        CreditAccount account = accounts
                .findForUpdate(userId)
                .orElseGet(() -> accounts.save(new CreditAccount(userId)));

        int balanceAfter;
        try {
            balanceAfter = account.apply(amount);
        } catch (IllegalStateException e) {
            throw new ApiException(ErrorCode.INSUFFICIENT_CREDIT);
        }
        accounts.save(account);

        CreditTransaction transaction = transactions.save(new CreditTransaction(
                userId, amount, balanceAfter, reason, refType, refId, actor, memo));

        // 금액이 움직인 것은 전부 남긴다. 나중에 "왜 줄었냐"는 문의에 답할 수 있어야 한다.
        log.info("프롬비 {} {} (사용자 {}, 사유 {}, 잔액 {})",
                amount > 0 ? "지급" : "차감", Math.abs(amount), userId, reason, balanceAfter);

        return transaction;
    }
}
