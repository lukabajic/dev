import { useEffect, useState } from "react";

import { Decimal } from "@liquity/lib-base";
import { useLiquityReducer, useLiquitySelector } from "@liquity/lib-react";

import { useMyTransactionState } from "../../Transaction";

import { StabilityDepositEditor } from "../StabilityDepositEditor";
import { useStabilityView } from "../context/StabilityViewContext";
import {
  selectForStabilityDepositChangeValidation,
  validateStabilityDepositChange
} from "../validation/validateStabilityDepositChange";
import { Yield } from "../Yield";

import classes from "./StabilityDepositManager.module.css";

const init = ({ stabilityDeposit }) => ({
  originalDeposit: stabilityDeposit,
  editedLUSD: stabilityDeposit.currentLUSD,
  changePending: false
});

const reduceWith = action => state => reduce(state, action);

const finishChange = reduceWith({ type: "finishChange" });
const revert = reduceWith({ type: "revert" });

const reduce = (state, action) => {
  const { originalDeposit, editedLUSD, changePending } = state;

  switch (action.type) {
    case "startChange": {
      return { ...state, changePending: true };
    }

    case "decrement": {
      const newStake = Decimal.from(action.newValue || 0).gt(originalDeposit.currentLUSD)
        ? Decimal.ZERO
        : originalDeposit.currentLUSD.sub(Decimal.from(action.newValue || 0));
      return { ...state, editedLUSD: newStake };
    }

    case "increment": {
      const newStake = originalDeposit.currentLUSD.add(Decimal.from(action.newValue || 0));
      return { ...state, editedLUSD: newStake };
    }

    case "finishChange":
      return { ...state, changePending: false };

    case "setDeposit":
      return { ...state, editedLUSD: Decimal.from(action.newValue || 0) };

    case "revert":
      return { ...state, editedLUSD: originalDeposit.currentLUSD };

    case "updateStore": {
      const {
        stateChange: { stabilityDeposit: updatedDeposit }
      } = action;

      if (!updatedDeposit) {
        return state;
      }

      const newState = { ...state, originalDeposit: updatedDeposit };

      const changeCommitted =
        !updatedDeposit.initialLUSD.eq(originalDeposit.initialLUSD) ||
        updatedDeposit.currentLUSD.gt(originalDeposit.currentLUSD) ||
        updatedDeposit.collateralGain.lt(originalDeposit.collateralGain) ||
        updatedDeposit.lqtyReward.lt(originalDeposit.lqtyReward);

      if (changePending && changeCommitted) {
        return finishChange(revert(newState));
      }

      return {
        ...newState,
        editedLUSD: updatedDeposit.apply(originalDeposit.whatChanged(editedLUSD))
      };
    }
    default:
      return state;
  }
};

const transactionId = "stability-deposit";

const Head = ({ total, title }) => {
  return (
    <div className={classes.head}>
      <div className={classes.total}>
        <p className={classes.totalStaked}>total staked {total.shorten()}</p>
        <Yield />
      </div>
      <h3 className={classes.title}>{title}</h3>
    </div>
  );
};

const StabilityDepositManager = () => {
  const [{ originalDeposit, editedLUSD, changePending }, dispatch] = useLiquityReducer(reduce, init);
  const validationContext = useLiquitySelector(selectForStabilityDepositChangeValidation);
  const { dispatchEvent, view } = useStabilityView();
  const [modal, setModal] = useState(null);

  const [validChange, error] = validateStabilityDepositChange(
    originalDeposit,
    editedLUSD,
    validationContext
  );

  const myTransactionState = useMyTransactionState(transactionId);

  useEffect(() => {
    if (
      myTransactionState.type === "waitingForApproval" ||
      myTransactionState.type === "waitingForConfirmation"
    ) {
      dispatch({ type: "startChange" });
    } else if (myTransactionState.type === "failed" || myTransactionState.type === "cancelled") {
      dispatch({ type: "finishChange" });
    } else if (myTransactionState.type === "confirmedOneShot") {
      dispatchEvent("DEPOSIT_CONFIRMED");
    }
  }, [myTransactionState.type, dispatch, dispatchEvent]);

  return (
    <>
      <Head
        total={validationContext.lusdInStabilityPool}
        title="Earn ETH and LQTY by depositing LUSD"
      />
      <StabilityDepositEditor
        modal={modal}
        setModal={setModal}
        originalDeposit={originalDeposit}
        editedLUSD={editedLUSD}
        changePending={changePending}
        dispatch={dispatch}
        validChange={validChange}
        transactionId={transactionId}
        view={view}
        dispatchEvent={dispatchEvent}
        error={error}
        transactionType={myTransactionState.type}
      />
    </>
  );
};

export default StabilityDepositManager;
