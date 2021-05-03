import { LP } from "../../../strings";
import ErrorDescription from "../../ErrorDescription";
import { useValidationState } from "../context/useValidationState";

export const Validation = ({ amount }) => {
  const { isValid, hasApproved, hasEnoughUniToken } = useValidationState(amount);

  if (isValid) {
    return null;
  }

  if (!hasApproved) {
    return <ErrorDescription>You haven't approved enough {LP}</ErrorDescription>;
  }

  if (!hasEnoughUniToken) {
    return <ErrorDescription>You don't have enough {LP}</ErrorDescription>;
  }

  return null;
};
