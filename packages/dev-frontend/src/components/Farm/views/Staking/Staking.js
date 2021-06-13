import { useState } from "react";

import { Decimal } from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { LP, GT } from "../../../../strings";
import { LoadingOverlay } from "../../../LoadingOverlay";
import { useMyTransactionState } from "../../../Transaction";
import { Approve } from "../Approve";
import { Confirm } from "../Confirm";
import StaticRow from "../../../StaticRow";
import Button from "../../../Button";
import Modal from "../../../Modal";
import Input from "../../../Input";
import ErrorDescription from "../../../ErrorDescription";
import { useValidationState } from "../../context/useValidationState";
import { Validation } from "../Validation";

import classes from "./Staking.module.css";

const transactionId = /farm-/;

const selector = ({ totalStakedUniTokens, uniTokenBalance }) => ({
  totalStakedUniTokens,
  uniTokenBalance
});

export const Staking = ({ hasApproved, dispatchEvent }) => {
  const { totalStakedUniTokens, uniTokenBalance } = useLiquitySelector(selector);
  const transactionState = useMyTransactionState(transactionId);
  const isTransactionPending =
    transactionState.type === "waitingForApproval" ||
    transactionState.type === "waitingForConfirmation";

  const [stake, setStake] = useState(null);
  const { maximumStake, hasSetMaximumStake, isValid } = useValidationState(Decimal.from(stake || 0));

  const nextTotalStakedUniTokens = totalStakedUniTokens.add(stake || 0);

  const poolShare = Decimal.from(stake || 0).mulDiv(100, nextTotalStakedUniTokens);

  return (
    <>
      {stake !== null && (
        <Modal
          title="STAKE UNI LP"
          onClose={() => {
            setStake(null);
            dispatchEvent("CANCEL_PRESSED");
          }}
        >
          <div className={classes.modalContent}>
            <Input
              autoFocus
              label="Stake"
              unit={LP}
              icon={process.env.PUBLIC_URL + "/icons/uniswap-uni-logo.png"}
              value={stake}
              onChange={v => {
                setStake(v);
              }}
              placeholder={Decimal.from(stake || 0).prettify(2)}
              maxAmount={maximumStake.toString()}
              maxedOut={hasSetMaximumStake}
              available={`Available: ${uniTokenBalance.prettify(2)}`}
            />

            {stake && <Validation amount={Decimal.from(stake)} />}

            <div className={classes.modalAction}>
              <Confirm isValid={isValid} amount={Decimal.from(stake || 0)} />
            </div>

            <StaticRow label="Staked" amount={Decimal.from(stake || 0).prettify(2)} unit={LP} />
            <StaticRow label="Pool share" amount={poolShare.prettify(4)} unit="%" />
          </div>
        </Modal>
      )}

      <div className={classes.infos}>
        <StaticRow label="Pool share" amount={Decimal.from(0).prettify(4)} unit="%" />

        <StaticRow label="Reward" amount={Decimal.from(0).prettify(2)} unit={GT} />
      </div>

      {!hasApproved ? (
        <ErrorDescription>
          To stake your {LP} tokens you need to allow Liquity to stake them for you
        </ErrorDescription>
      ) : (
        <div className={classes.stakedWrapper}>
          <StaticRow
            label="Staked"
            labelColor="primary"
            amount={Decimal.from(0).prettify(0)}
            unit={LP}
          />
        </div>
      )}

      <div className={classes.actions}>
        {!hasApproved ? (
          <Approve amount={Decimal.from(0)} />
        ) : (
          <Button
            primary
            large
            onClick={() => {
              setStake("");
              dispatchEvent("STAKE_PRESSED");
            }}
          >
            Stake
          </Button>
        )}
      </div>

      {isTransactionPending && <LoadingOverlay />}
    </>
  );
};

//<Button variant="cancel" onClick={handleCancelPressed}>
//Cancel
//</Button>
//<Description amount={amount} />
//{isDirty && <Validation amount={amount} />}
