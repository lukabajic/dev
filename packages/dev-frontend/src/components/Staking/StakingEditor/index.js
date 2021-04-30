import { useState, useEffect } from "react";
import cn from "classnames";

import { Decimal } from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { GT, COIN } from "../../../strings";

import { LoadingOverlay } from "../../LoadingOverlay";
import StaticRow from "../../StaticRow";
import Button from "../../Button";
import Modal from "../../Modal";
import Input from "../../Input";
import ErrorDescription from "../../ErrorDescription";
import { Amount } from "../../ActionDescription";

import { useStakingView } from "./../context/StakingViewContext";
import StakingManagerAction from "../StakingManagerAction";
import StakingGainsAction from "../StakingGainsAction";

import classes from "./StakingEditor.module.css";

const select = ({ lqtyBalance, totalStakedLQTY }) => ({
  lqtyBalance,
  totalStakedLQTY
});

const StakingEditor = ({ view, modal, setModal, children, originalStake, editedLQTY, dispatch }) => {
  const { lqtyBalance, totalStakedLQTY } = useLiquitySelector(select);
  const { changePending } = useStakingView();
  const [stakeLQTY, setStakeLQTY] = useState("");

  useEffect(() => {
    setStakeLQTY("");
    dispatch({ type: "revert" });
  }, [view, dispatch]);

  const totalStakedLQTYAfterChange = totalStakedLQTY.sub(originalStake.stakedLQTY).add(editedLQTY);

  const originalPoolShare = originalStake.stakedLQTY.mulDiv(100, totalStakedLQTY);
  const newPoolShare = editedLQTY.mulDiv(100, totalStakedLQTYAfterChange);

  const redemptionGain = originalStake.isEmpty ? Decimal.ZERO : originalStake.collateralGain;
  const issuanceGain = originalStake.isEmpty ? Decimal.ZERO : originalStake.lusdGain;
  const staked = originalStake.isEmpty ? Decimal.ZERO : originalStake.stakedLQTY;

  const change = originalStake.whatChanged(editedLQTY);

  const [validChange, error] = !change
    ? [undefined, undefined]
    : change.stakeLQTY?.gt(lqtyBalance)
    ? [
        undefined,
        <ErrorDescription>
          The amount you're trying to stake exceeds your balance by{" "}
          <Amount>
            {change.stakeLQTY.sub(lqtyBalance).prettify()} {GT}
          </Amount>
          .
        </ErrorDescription>
      ]
    : [change, undefined];

  return (
    <div className={classes.wrapper}>
      {modal && (
        <Modal title="STAKE LUSD" onClose={() => setModal(null)}>
          <div className={classes.modalContent}>
            <Input
              label="Stake"
              unit={GT}
              icon={process.env.PUBLIC_URL + "/icons/128-lusd-icon.svg"}
              value={stakeLQTY}
              onChange={v => {
                setStakeLQTY(v);
                dispatch({ type: "setStake", newValue: v });
              }}
              placeholder={Decimal.from(stakeLQTY || 0).prettify(2)}
            />

            {error}

            <div className={classes.modalActions}>
              {validChange ? (
                <StakingManagerAction change={validChange} />
              ) : (
                <Button large primary disabled>
                  Confirm
                </Button>
              )}
            </div>

            <StaticRow label="Staked" amount={editedLQTY.prettify(2)} unit={COIN} />
          </div>
        </Modal>
      )}

      <div className={classes.staticInfo}>
        {newPoolShare.infinite ? (
          <StaticRow label="Pool share" amount="N/A" />
        ) : (
          <StaticRow label="Pool share" amount={originalPoolShare.prettify(1)} unit="%" />
        )}

        <StaticRow label="Redemption gain" amount={redemptionGain.prettify(4)} unit="ETH" />

        <StaticRow label="Issuance gain" amount={issuanceGain.prettify(2)} unit={COIN} boldLabel />
      </div>

      <div className={classes.stakedWrapper}>
        {view !== "NONE" ? (
          <>
            <p className={classes.editLabel}>Staked</p>
            <p className={classes.editAmount}>
              {editedLQTY.prettify(2)} {GT}
            </p>
            <div className={classes.editActions}>
              <button
                onClick={() => {
                  dispatch({ type: "decrement" });
                }}
                disabled={editedLQTY.eq(originalStake.stakedLQTY)}
                className={cn({ [classes.disabled]: editedLQTY.eq(originalStake.stakedLQTY) })}
              >
                &#8722;
              </button>
              <button
                onClick={() => {
                  dispatch({ type: "increment" });
                }}
                className={cn({ [classes.disabled]: false })}
              >
                &#43;
              </button>
            </div>
          </>
        ) : (
          <StaticRow labelColor="primary" label="Staked" amount={staked.prettify(2)} unit={COIN} />
        )}
      </div>

      {error}

      <div className={classes.actions}>
        {view !== "NONE" ? (
          <StakingGainsAction />
        ) : validChange ? (
          <StakingManagerAction change={validChange}>Confirm</StakingManagerAction>
        ) : (
          <Button primary large uppercase onClick={() => setModal(true)}>
            Stake
          </Button>
        )}
      </div>

      {children}

      {changePending && <LoadingOverlay />}
    </div>
  );
};

export default StakingEditor;
