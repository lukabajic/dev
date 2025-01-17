import { useState, useEffect } from "react";
import cn from "classnames";

import { Decimal } from "@liquity/lib-base";

import { useLiquitySelector } from "@liquity/lib-react";

import { COIN, GT } from "../../../strings";

import { LoadingOverlay } from "../../LoadingOverlay";
import StaticRow from "../../StaticRow";
import Modal from "../../Modal";
import Input from "../../Input";
import StabilityDepositAction from "../StabilityDepositAction";
import Button from "../../Button";
import ClaimAndMove from "../actions/ClaimAndMove";
import ClaimRewards from "../actions/ClaimRewards";
import ErrorDescription from "../../ErrorDescription";
import ActionDescription from "../../ActionDescription";
import { Amount } from "../../Amount";

import { lusdIcon } from "../../../images";

import classes from "./StabilityDepositEditor.module.css";

const select = ({ lusdBalance, lusdInStabilityPool, stabilityDeposit }) => ({
  lusdBalance,
  lusdInStabilityPool,
  stabilityDeposit
});

export const StabilityDepositEditor = ({
  originalDeposit,
  editedLUSD,
  changePending,
  dispatch,
  children,
  validChange,
  transactionId,
  view,
  dispatchEvent,
  error,
  transactionType
}) => {
  const { lusdBalance, lusdInStabilityPool, stabilityDeposit } = useLiquitySelector(select);
  const [stake, setStake] = useState(null);
  const [increment, setIncrement] = useState(null);
  const [decrement, setDecrement] = useState(null);

  useEffect(() => {
    if (transactionType === "confirmedOneShot") {
      setStake(null);
      setIncrement(null);
      setDecrement(null);
    }
  }, [transactionType]);

  const maxAmount = originalDeposit.currentLUSD.add(lusdBalance);
  const maxedOut = editedLUSD.eq(maxAmount);

  const lusdInStabilityPoolAfterChange = lusdInStabilityPool
    .sub(originalDeposit.currentLUSD)
    .add(editedLUSD);

  const originalPoolShare = originalDeposit.currentLUSD.mulDiv(100, lusdInStabilityPool);
  const newPoolShare = editedLUSD.mulDiv(100, lusdInStabilityPoolAfterChange);

  const hasReward = !stabilityDeposit.lqtyReward.isZero;
  const hasGain = !stabilityDeposit.collateralGain.isZero;

  const liquidationGain = originalDeposit.isEmpty ? Decimal.ZERO : originalDeposit.collateralGain;

  const reward = originalDeposit.isEmpty ? Decimal.ZERO : stabilityDeposit.lqtyReward;

  return (
    <div className={classes.wrapper}>
      {stake !== null && (
        <Modal
          title="STAKE LUSD"
          onClose={() => {
            setStake(null);
            dispatchEvent("CANCEL_PRESSED");
            dispatch({ type: "revert" });
          }}
        >
          <div className={classes.modalContent}>
            <Input
              autoFocus
              label="stake"
              unit={COIN}
              icon={lusdIcon}
              value={stake}
              onChange={v => {
                setStake(v);
                dispatch({ type: "setDeposit", newValue: v });
              }}
              placeholder={Decimal.from(stake || 0).prettify(2)}
              maxAmount={maxAmount.toString()}
              available={`Available: ${maxAmount.prettify(2)}`}
              maxedOut={maxedOut}
            />

            {error}

            <div className={classes.modalActions}>
              {validChange ? (
                <StabilityDepositAction transactionId={transactionId} change={validChange} />
              ) : (
                <Button large primary disabled>
                  Confirm
                </Button>
              )}
            </div>

            <StaticRow label="Pool share" amount={newPoolShare.prettify(4)} unit="%" />
          </div>
        </Modal>
      )}

      {increment !== null && (
        <Modal
          title="STAKE LUSD"
          onClose={() => {
            setIncrement(null);
            dispatchEvent("CANCEL_PRESSED");
            dispatch({ type: "revert" });
          }}
        >
          <div className={classes.modalContent}>
            <Input
              autoFocus
              label="stake"
              unit={COIN}
              icon={lusdIcon}
              value={increment}
              onChange={v => {
                setIncrement(v);
                dispatch({ type: "increment", newValue: v });
              }}
              placeholder={Decimal.from(increment || 0).prettify(2)}
              maxAmount={lusdBalance.toString()}
              available={`Available: ${lusdBalance.prettify(2)}`}
              maxedOut={Decimal.from(increment || 0).eq(lusdBalance)}
            />

            {error || (
              <ActionDescription>
                Adjusting the position automatically collects rewards.
              </ActionDescription>
            )}

            <div className={classes.modalActions}>
              {validChange && !Decimal.from(increment || 0).gt(lusdBalance) ? (
                <StabilityDepositAction transactionId={transactionId} change={validChange} />
              ) : (
                <Button large primary disabled>
                  Confirm
                </Button>
              )}
            </div>

            <StaticRow label="Staked" amount={editedLUSD.prettify(2)} unit={COIN} />
            <StaticRow label="Pool share" amount={newPoolShare.prettify(4)} unit="%" />
          </div>
        </Modal>
      )}

      {decrement !== null && (
        <Modal
          title="UNSTAKE LUSD"
          onClose={() => {
            setDecrement(null);
            dispatchEvent("CANCEL_PRESSED");
            dispatch({ type: "revert" });
          }}
        >
          <div className={classes.modalContent}>
            <Input
              autoFocus
              label="unstake"
              unit={COIN}
              icon={lusdIcon}
              value={decrement}
              onChange={v => {
                setDecrement(v);
                dispatch({ type: "decrement", newValue: v });
              }}
              placeholder={Decimal.from(decrement || 0).prettify(2)}
              maxAmount={originalDeposit.currentLUSD.toString()}
              maxedOut={Decimal.from(decrement || 0).eq(originalDeposit.currentLUSD)}
              available={`Available: ${originalDeposit.currentLUSD.prettify(2)}`}
            />

            {error ||
              (Decimal.from(decrement || 0).gt(originalDeposit.currentLUSD) ? (
                <ErrorDescription>
                  The amount you're trying to unstake exceeds your stake by{" "}
                  <Amount>
                    {Decimal.from(decrement).sub(originalDeposit.currentLUSD).prettify()} {GT}
                  </Amount>
                  .
                </ErrorDescription>
              ) : (
                <ActionDescription>
                  Adjusting the position automatically collects rewards.
                </ActionDescription>
              ))}

            <div className={classes.modalActions}>
              {validChange && !Decimal.from(decrement || 0).gt(originalDeposit.currentLUSD) ? (
                <StabilityDepositAction transactionId={transactionId} change={validChange} />
              ) : (
                <Button large primary disabled>
                  Confirm
                </Button>
              )}
            </div>

            <StaticRow label="Staked" amount={editedLUSD.prettify(2)} unit={COIN} />
            <StaticRow label="Pool share" amount={newPoolShare.prettify(4)} unit="%" />
          </div>
        </Modal>
      )}

      <div className={classes.staticInfo}>
        {newPoolShare.infinite ? (
          <StaticRow label="Pool share" amount="N/A" />
        ) : (
          <StaticRow label="Pool share" amount={originalPoolShare.prettify(4)} unit="%" />
        )}

        <StaticRow label="Liquidation gain" amount={liquidationGain.prettify(4)} unit="ETH" />

        <StaticRow
          label="Reward"
          amount={reward.prettify(2)}
          unit={GT}
          tooltip="Although the LQTY rewards accrue every minute, the value on the UI only updates when a user transacts with the Stability Pool. Therefore you may receive more rewards than is displayed when you claim or adjust your deposit."
        />
      </div>

      <div className={classes.stakedWrapper}>
        {view !== "NONE" ? (
          <>
            <p className={classes.editLabel}>Staked</p>
            <p className={classes.editAmount}>
              {originalDeposit.currentLUSD.prettify(2)} {COIN}
            </p>
            <div className={classes.editActions}>
              <button
                onClick={() => {
                  dispatchEvent("ADJUST_DEPOSIT_PRESSED");
                  setDecrement("");
                }}
                disabled={originalDeposit.currentLUSD.isZero}
                className={cn({ [classes.disabled]: originalDeposit.currentLUSD.isZero })}
              >
                &#8722;
              </button>
              <button
                onClick={() => {
                  dispatchEvent("ADJUST_DEPOSIT_PRESSED");
                  setIncrement("");
                }}
                disabled={lusdBalance.isZero}
                className={cn({ [classes.disabled]: lusdBalance.isZero })}
              >
                &#43;
              </button>
            </div>
          </>
        ) : (
          <StaticRow
            labelColor="primary"
            label="Staked"
            amount={originalDeposit.currentLUSD.prettify(2)}
            unit={COIN}
          />
        )}
      </div>

      <div className={classes.actions}>
        {["ACTIVE", "ADJUSTING"].includes(view) ? (
          <>
            <ClaimRewards disabled={!hasGain && !hasReward} />
            <ClaimAndMove disabled={!hasGain} />
          </>
        ) : (
          <Button
            primary
            large
            uppercase
            onClick={() => {
              setStake("");
              dispatchEvent("DEPOSIT_PRESSED");
            }}
          >
            Stake
          </Button>
        )}
      </div>

      {children}

      {changePending && <LoadingOverlay />}
    </div>
  );
};
