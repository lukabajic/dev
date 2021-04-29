import { Button } from "theme-ui";
import { useLiquitySelector } from "@liquity/lib-react";

import { useLiquity } from "../../hooks/LiquityContext";
import { useTransactionFunction } from "../Transaction";

const selectFrontendRegistered = ({ frontend }) => frontend.status === "registered";

export const StabilityDepositAction = ({ children, transactionId, change }) => {
  const { config, liquity } = useLiquity();
  const frontendRegistered = useLiquitySelector(selectFrontendRegistered);

  const frontendTag = frontendRegistered ? config.frontendTag : undefined;

  const [sendTransaction] = useTransactionFunction(
    transactionId,
    change.depositLUSD
      ? liquity.send.depositLUSDInStabilityPool.bind(liquity.send, change.depositLUSD, frontendTag)
      : liquity.send.withdrawLUSDFromStabilityPool.bind(liquity.send, change.withdrawLUSD)
  );

  return <Button onClick={sendTransaction}>{children}</Button>;
};
