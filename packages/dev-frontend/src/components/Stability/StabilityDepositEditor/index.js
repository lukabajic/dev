import { useState } from "react";
import { Box, Card } from "theme-ui";

import { Decimal, Difference } from "@liquity/lib-base";

import { useLiquitySelector } from "@liquity/lib-react";

import { COIN, GT } from "../../../strings";

import { EditableRow } from "../../Trove/Editor";
import { LoadingOverlay } from "../../LoadingOverlay";
import { InfoIcon } from "../../InfoIcon";
import StaticRow from "../../StaticRow";
import Modal from "../../Modal";
import Input from "../../Input";
import StabilityDepositAction from "../StabilityDepositAction";
import Button from "../../Button";
import ClaimAndMove from "../actions/ClaimAndMove";
import ClaimRewards from "../actions/ClaimRewards";

import classes from "./StabilityDepositEditor.module.css";

const select = ({ lusdBalance, lusdInStabilityPool }) => ({
  lusdBalance,
  lusdInStabilityPool
});

export const StabilityDepositEditor = ({
  originalDeposit,
  editedLUSD,
  changePending,
  dispatch,
  children,
  modal,
  setModal,
  validChange,
  transactionId,
  view
}) => {
  const { lusdBalance, lusdInStabilityPool } = useLiquitySelector(select);
  const editingState = useState();
  const [lqty, setLqty] = useState("");

  const edited = !editedLUSD.eq(originalDeposit.currentLUSD);

  const maxAmount = originalDeposit.currentLUSD.add(lusdBalance);
  const maxedOut = editedLUSD.eq(maxAmount);

  console.log(originalDeposit);

  const lusdInStabilityPoolAfterChange = lusdInStabilityPool
    .sub(originalDeposit.currentLUSD)
    .add(editedLUSD);

  const originalPoolShare = originalDeposit.currentLUSD.mulDiv(100, lusdInStabilityPool);
  const newPoolShare = editedLUSD.mulDiv(100, lusdInStabilityPoolAfterChange);
  const poolShareChange =
    originalDeposit.currentLUSD.nonZero &&
    Difference.between(newPoolShare, originalPoolShare).nonZero;

  return (
    <div className={classes.wrapper}>
      {modal && (
        <Modal title="STAKE LUSD" onClose={() => setModal(null)}>
          <div className={classes.modalContent}>
            <Input
              label="Stake"
              unit={GT}
              icon={process.env.PUBLIC_URL + "/icons/LQTY icon.png"}
              value={lqty}
              onChange={v => {
                setLqty(v);
                dispatch({ type: "setDeposit", newValue: v });
              }}
              placeholder={Decimal.from(lqty || 0).prettify(2)}
            />
            <StaticRow label="Pool share" amount={newPoolShare.prettify(1)} unit="%" />
            {validChange ? (
              <StabilityDepositAction transactionId={transactionId} change={validChange} />
            ) : (
              <Button large primary disabled>
                Confirm
              </Button>
            )}
          </div>
        </Modal>
      )}

      <div className={classes.staticInfo}>
        {newPoolShare.infinite ? (
          <StaticRow label="Pool share" amount="N/A" />
        ) : (
          <StaticRow label="Pool share" amount={newPoolShare.prettify(4)} unit="%" />
        )}

        <StaticRow
          label="Liquidation gain"
          amount={
            originalDeposit.isEmpty
              ? Decimal.ZERO.prettify(2)
              : originalDeposit.collateralGain.prettify(4)
          }
          color={
            originalDeposit.isEmpty
              ? Decimal.ZERO.prettify(2)
              : originalDeposit.collateralGain.nonZero && "success"
          }
          unit="ETH"
        />

        <StaticRow
          label="Reward"
          amount={
            originalDeposit.isEmpty
              ? Decimal.ZERO.prettify(2)
              : originalDeposit.lqtyReward.prettify()
          }
          color={
            originalDeposit.isEmpty
              ? Decimal.ZERO.prettify(2)
              : originalDeposit.lqtyReward.nonZero && "success"
          }
          unit={GT}
          boldLabel
        />
      </div>

      <div className={classes.stakedWrapper}>
        <StaticRow
          labelColor="primary"
          label="Staked"
          amount={originalDeposit.currentLUSD.prettify(0)}
          unit={COIN}
        />
      </div>

      <div className={classes.actions}>
        {["ACTIVE", "ADJUSTING"].includes(view) ? (
          <>
            <ClaimAndMove />
            <ClaimRewards />
          </>
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

//<Card variant="tooltip" sx={{ width: "240px" }}>
//Although the LQTY rewards accrue every minute, the value on the UI only updates
//when a user transacts with the Stability Pool. Therefore you may receive more
//rewards than is displayed when you claim or adjust your deposit.
//</Card>
