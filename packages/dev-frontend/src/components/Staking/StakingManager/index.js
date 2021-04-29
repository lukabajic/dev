import { Button, Flex } from "theme-ui";

import { Decimal } from "@liquity/lib-base";

import { useLiquityReducer, useLiquitySelector } from "@liquity/lib-react";

import { GT, COIN } from "../../../strings";

import { useStakingView } from "./../context/StakingViewContext";
import { StakingEditor } from "./../StakingEditor";
import { StakingManagerAction } from "./../StakingManagerAction";
import { ActionDescription, Amount } from "../../ActionDescription";
import ErrorDescription from "../../ErrorDescription";

import classes from "./StakingManager.module.css";

const init = ({ lqtyStake }) => ({
  originalStake: lqtyStake,
  editedLQTY: lqtyStake.stakedLQTY
});

const reduce = (state, action) => {
  const { originalStake, editedLQTY } = state;

  switch (action.type) {
    case "setStake":
      return { ...state, editedLQTY: Decimal.from(action.newValue) };

    case "revert":
      return { ...state, editedLQTY: originalStake.stakedLQTY };

    case "updateStore": {
      const {
        stateChange: { lqtyStake: updatedStake }
      } = action;

      if (updatedStake) {
        return {
          originalStake: updatedStake,
          editedLQTY: updatedStake.apply(originalStake.whatChanged(editedLQTY))
        };
      }
      return state;
    }
    default:
      return state;
  }
};

const selectLQTYBalance = ({ lqtyBalance, lusdInStabilityPool }) => ({
  lqtyBalance,
  lusdInStabilityPool
});

const StakingManagerActionDescription = ({ originalStake, change }) => {
  const stakeLQTY = change.stakeLQTY?.prettify().concat(" ", GT);
  const unstakeLQTY = change.unstakeLQTY?.prettify().concat(" ", GT);
  const collateralGain = originalStake.collateralGain.nonZero?.prettify(4).concat(" ETH");
  const lusdGain = originalStake.lusdGain.nonZero?.prettify().concat(" ", COIN);

  if (originalStake.isEmpty && stakeLQTY) {
    return (
      <ActionDescription>
        You are staking <Amount>{stakeLQTY}</Amount>.
      </ActionDescription>
    );
  }

  return (
    <ActionDescription>
      {stakeLQTY && (
        <>
          You are adding <Amount>{stakeLQTY}</Amount> to your stake
        </>
      )}
      {unstakeLQTY && (
        <>
          You are withdrawing <Amount>{unstakeLQTY}</Amount> to your wallet
        </>
      )}
      {(collateralGain || lusdGain) && (
        <>
          {" "}
          and claiming{" "}
          {collateralGain && lusdGain ? (
            <>
              <Amount>{collateralGain}</Amount> and <Amount>{lusdGain}</Amount>
            </>
          ) : (
            <>
              <Amount>{collateralGain ?? lusdGain}</Amount>
            </>
          )}
        </>
      )}
      .
    </ActionDescription>
  );
};

const Head = ({ total, title }) => {
  return (
    <div className={classes.head}>
      <div className={classes.total}>
        <p className={classes.totalStaked}>total staked {total.div(1000).prettify(0)}k</p>
        <p className={classes.totalAPR}>APR 25%</p>
      </div>
      <h3 className={classes.title}>{title}</h3>
    </div>
  );
};

const StakingManager = ({ view }) => {
  const { dispatch: dispatchStakingViewAction } = useStakingView();
  const [{ originalStake, editedLQTY }, dispatch] = useLiquityReducer(reduce, init);
  const { lqtyBalance, lusdInStabilityPool } = useLiquitySelector(selectLQTYBalance);

  const change = originalStake.whatChanged(editedLQTY);
  const [validChange, description] = !change
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
    : [change, <StakingManagerActionDescription originalStake={originalStake} change={change} />];

  const makingNewStake = originalStake.isEmpty;

  return (
    <>
      <Head
        total={lusdInStabilityPool}
        title="Stake LQTY to earn a share of borrowing and redemption fees"
      />
      <StakingEditor title={"Staking"} {...{ originalStake, editedLQTY, dispatch }}>
        {description ??
          (makingNewStake ? (
            <ActionDescription>Enter the amount of {GT} you'd like to stake.</ActionDescription>
          ) : (
            <ActionDescription>Adjust the {GT} amount to stake or withdraw.</ActionDescription>
          ))}

        <Button
          variant="cancel"
          onClick={() => dispatchStakingViewAction({ type: "cancelAdjusting" })}
        >
          Cancel
        </Button>

        {validChange ? (
          <StakingManagerAction change={validChange}>Confirm</StakingManagerAction>
        ) : (
          <Button disabled>Confirm</Button>
        )}
      </StakingEditor>
    </>
  );
};

export default StakingManager;
