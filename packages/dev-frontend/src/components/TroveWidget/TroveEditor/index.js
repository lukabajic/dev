import { useState, useEffect } from "react";

import {
  Percent,
  Decimal,
  LUSD_LIQUIDATION_RESERVE,
  CRITICAL_COLLATERAL_RATIO,
  LUSD_MINIMUM_DEBT
} from "@liquity/lib-base";
import { useLiquitySelector } from "@liquity/lib-react";

import { LoadingOverlay } from "../../LoadingOverlay";
import Input from "../../Input";
import StaticRow from "../../StaticRow";
import { WithdrawPreview, DepositPreview } from "../../../pages/WalletConnector/Preview";
import ErrorDescription from "../../ErrorDescription";
import ActionDescription from "../../ActionDescription";

import { ETH, COIN } from "../../../strings";
import { lusdIcon, ethereumIcon } from "../../../images";

import classes from "./TroveEditor.module.css";

const gasRoomETH = Decimal.from(0.01);

const getColor = ratio =>
  ratio?.gt(CRITICAL_COLLATERAL_RATIO)
    ? "success"
    : ratio?.gt(1.2)
    ? "warning"
    : ratio?.lte(1.2)
    ? "danger"
    : "muted";

const select = ({ price, accountBalance, lusdBalance, collateralSurplusBalance }) => ({
  price,
  accountBalance,
  lusdBalance,
  hasSurplusCollateral: !collateralSurplusBalance.isZero
});

export const TroveDeposit = ({
  children,
  original,
  edited,
  borrowingRate,
  changePending,
  dispatch,
  transactionType
}) => {
  const { price, accountBalance, hasSurplusCollateral } = useLiquitySelector(select);
  const [deposit, setDeposit] = useState("");
  const [borrow, setBorrow] = useState("");

  useEffect(() => {
    if (!deposit && !borrow) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      });
    }
  }, [deposit, borrow]);

  useEffect(() => {
    if (transactionType === "confirmedOneShot") {
      setDeposit("");
      setBorrow("");
    }
  }, [transactionType]);

  useEffect(() => {
    dispatch({ type: "revert" });
  }, [dispatch]);

  const fee = Decimal.from(borrow || 0).mul(borrowingRate);

  const feePct = new Percent(borrowingRate);

  const originalCollateralRatio = !original.isEmpty ? original.collateralRatio(price) : undefined;
  const collateralRatio = !edited.isEmpty ? edited.collateralRatio(price) : undefined;
  const collateralRatioPct = new Percent(collateralRatio ?? { toString: () => "N/A" });
  const originalCollateralRatioPct = new Percent(
    originalCollateralRatio ?? { toString: () => "N/A" }
  );

  const maxEth = accountBalance.gt(gasRoomETH) ? accountBalance.sub(gasRoomETH) : Decimal.ZERO;

  const totalFee = original.isEmpty ? LUSD_LIQUIDATION_RESERVE.add(fee) : fee;

  return (
    <div className={classes.wrapper}>
      {hasSurplusCollateral ? (
        <DepositPreview onClick={() => {}} />
      ) : (
        <>
          <Input
            label="deposit"
            placeholder={Decimal.from(deposit || 0).prettify(4)}
            unit={ETH}
            value={deposit}
            onChange={v => {
              setDeposit(v);
              dispatch({ type: "setCollateral", newValue: v });
            }}
            available={`Wallet: ${maxEth.prettify(4)}`}
            icon={ethereumIcon}
            maxAmount={maxEth.toString()}
            maxedOut={maxEth.toString() === deposit.toString()}
            min={0}
            step={0.1}
            autoFocus
          />

          <Input
            label="borrow"
            placeholder={Decimal.from(borrow || 0).prettify(4)}
            unit={COIN}
            value={borrow}
            onChange={v => {
              setBorrow(v);
              dispatch({
                type: "setDebt",
                newValue: v,
                fee: original.isEmpty
                  ? LUSD_LIQUIDATION_RESERVE.add(Decimal.from(v || 0).mul(borrowingRate))
                  : Decimal.from(v || 0).mul(borrowingRate)
              });
            }}
            icon={lusdIcon}
            min={0}
            step={100}
          />
        </>
      )}

      {children}

      {(deposit > 0 || borrow > 0) && (
        <div className={classes.statickInfo}>
          {deposit > 0 && (
            <StaticRow
              className={classes.staticRowInfo}
              label="Deposit"
              inputId="trove-collateral-value"
              amount={Decimal.from(deposit).prettify(4)}
              unit={ETH}
            />
          )}

          {original.isEmpty && (
            <StaticRow
              className={classes.staticRowInfo}
              label="Liquidation Reserve"
              amount={`${LUSD_LIQUIDATION_RESERVE}`}
              unit={COIN}
              tooltip="An amount set aside to cover the liquidator’s gas costs if your Trove needs to be
              liquidated. The amount increases your debt and is refunded if you close your
              Trove by fully paying off its net debt."
            />
          )}

          <StaticRow
            className={classes.staticRowInfo}
            label="Borrowing Fee"
            amount={fee.toString(2)}
            unit={COIN}
            brackets={feePct.prettify()}
            tooltip="This amount is deducted from the borrowed amount as a one-time fee. There are no
            recurring fees for borrowing, which is thus interest-free."
          />

          {borrow && (
            <StaticRow
              className={classes.staticRowInfo}
              label="Recieve"
              inputId="trove-recieve-value"
              unit={COIN}
              amount={Decimal.from(borrow || 0).prettify(2)}
            />
          )}

          {borrow && (
            <StaticRow
              label="Total debt"
              inputId="trove-total-debt"
              amount={Decimal.from(borrow || 0)
                .add(totalFee)
                .add(original.debt)
                .prettify(2)}
              unit={COIN}
              tooltip="The total amount of LUSD your Trove will hold"
            />
          )}

          <StaticRow
            scrollIntoView
            className={classes.staticRowInfo}
            label="Collateral ratio"
            amount={collateralRatioPct.prettify()}
            color={getColor(collateralRatio)}
            oldAmount={
              original.isEmpty && !borrow ? (
                <span>&infin;</span>
              ) : (
                originalCollateralRatio && originalCollateralRatioPct.prettify()
              )
            }
            oldColor={getColor(originalCollateralRatio)}
            tooltip="The ratio between the dollar value of the collateral and the debt (in LUSD) you are
            depositing. While the Minimum Collateral Ratio is 110% during normal operation, it
            is recommended to keep the Collateral Ratio always above 150% to avoid liquidation
            under Recovery Mode. A Collateral Ratio above 200% or 250% is recommended for
            additional safety."
          />
        </div>
      )}

      {changePending && <LoadingOverlay />}
    </div>
  );
};

export const TroveWithdraw = ({
  children,
  original,
  edited,
  changePending,
  dispatch,
  transactionType
}) => {
  const { price, lusdBalance, hasSurplusCollateral } = useLiquitySelector(select);
  const [withdraw, setWithdraw] = useState("");
  const [repay, setRepay] = useState("");
  const [data, setData] = useState(null);
  const [previewAlert, setPreviewAlert] = useState(false);

  useEffect(() => {
    dispatch({ type: "revert" });
  }, [dispatch]);

  useEffect(() => {
    if (!withdraw && !repay) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      });
    }
  }, [withdraw, repay]);

  useEffect(() => {
    if (transactionType === "confirmedOneShot") {
      setRepay("");
      setWithdraw("");
    }
  }, [transactionType]);

  useEffect(() => {
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,liquity-usd&vs_currencies=usd&include_24hr_change=true",
      {
        method: "GET"
      }
    )
      .then(res => res.json())
      .then(setData)
      .catch(console.warn);
  }, []);

  if (original.isEmpty)
    return (
      <WithdrawPreview onClick={() => setPreviewAlert(true)}>
        {previewAlert && (
          <ErrorDescription>Please make a deposit before you withdraw.</ErrorDescription>
        )}
        {children}
      </WithdrawPreview>
    );

  const originalCollateralRatio = !original.isEmpty ? original.collateralRatio(price) : undefined;
  const collateralRatio = !edited.isEmpty ? edited.collateralRatio(price) : undefined;

  const collateralRatioPct = new Percent(collateralRatio ?? { toString: () => "N/A" });
  const originalCollateralRatioPct = new Percent(
    originalCollateralRatio ?? { toString: () => "N/A" }
  );

  let maxRepay = original.debt.sub(Decimal.from(LUSD_MINIMUM_DEBT));
  maxRepay = maxRepay.gt(lusdBalance) ? lusdBalance : maxRepay;

  let maxWithdraw = null;

  if (data) {
    // const ETHEREUM_IN_USD = data.ethereum.usd;
    const ETHEREUM_IN_USD = price;
    const LUSD_IN_USD = data["liquity-usd"].usd;

    const ethereumInLusd = ETHEREUM_IN_USD / LUSD_IN_USD;

    maxWithdraw = original.collateral.gt(
      edited.debt.mul(Decimal.from(1.1).div(Decimal.from(ethereumInLusd)))
    )
      ? original.collateral.sub(edited.debt.mul(Decimal.from(1.1).div(Decimal.from(ethereumInLusd))))
      : Decimal.from(0);
  }

  return (
    <div className={classes.wrapper}>
      {hasSurplusCollateral ? (
        <WithdrawPreview onClick={() => {}} />
      ) : (
        <>
          <Input
            label="withdraw"
            placeholder={Decimal.from(withdraw || 0).prettify(4)}
            unit={ETH}
            value={withdraw}
            onChange={v => {
              setWithdraw(v);
              dispatch({ type: "substractCollateral", newValue: v });
            }}
            available={`Available: ${maxWithdraw?.prettify(4) || ""}`}
            icon={ethereumIcon}
            maxAmount={maxWithdraw?.toString() || ""}
            maxedOut={maxWithdraw?.toString() === withdraw.toString()}
            min={0}
            step={0.1}
            autoFocus
          />

          <Input
            label="repay"
            placeholder={Decimal.from(repay || 0).prettify(4)}
            unit={COIN}
            value={repay}
            onChange={v => {
              setRepay(v);
              dispatch({ type: "substractDebt", newValue: v });
            }}
            available={`Available: ${maxRepay.prettify(2)}`}
            icon={lusdIcon}
            maxAmount={maxRepay.toString()}
            maxedOut={maxRepay.toString() === repay.toString()}
            min={0}
            step={100}
          />
        </>
      )}

      {maxWithdraw?.toString() === withdraw.toString() && (
        <ActionDescription>
          Position with 110% CR is highly risky. Keeping your CR above 150% can help avoid
          liquidation
        </ActionDescription>
      )}

      {children}

      {(withdraw > 0 || repay > 0) && (
        <div className={classes.statickInfo}>
          {withdraw > 0 && (
            <StaticRow
              label="Withdraw"
              inputId="trove-collateral-value"
              amount={Decimal.from(withdraw || 0).prettify(4)}
              unit={ETH}
            />
          )}

          {repay > 0 && (
            <StaticRow
              label="Repay"
              inputId="trove-repay-value"
              amount={Decimal.from(repay).prettify()}
              unit={COIN}
            />
          )}

          {repay && (
            <StaticRow
              label="Total debt"
              inputId="trove-total-debt"
              amount={
                Decimal.from(repay || 0).gt(maxRepay)
                  ? original.debt.gt(Decimal.from(repay || 0))
                    ? original.debt.sub(Decimal.from(repay || 0)).prettify(2)
                    : Decimal.ZERO.prettify(2)
                  : original.debt.sub(Decimal.from(repay || 0)).prettify(2)
              }
              unit={COIN}
              tooltip="The total amount of LUSD your Trove will hold"
            />
          )}

          <StaticRow
            scrollIntoView
            label="Collateral ratio"
            inputId="trove-collateral-ratio"
            amount={collateralRatioPct.prettify()}
            color={getColor(collateralRatio)}
            oldAmount={originalCollateralRatio && originalCollateralRatioPct.prettify()}
            oldColor={getColor(originalCollateralRatio)}
            tooltip="The ratio between the dollar value of the collateral and the debt (in LUSD) you are
            depositing. While the Minimum Collateral Ratiow is 110% during normal operation, it
            is recommended to keep the Collateral Ratio always above 150% to avoid liquidation
            under Recovery Mode. A Collateral Ratio above 200% or 250% is recommended for
            additional safety."
          />
        </div>
      )}

      {changePending && <LoadingOverlay />}
    </div>
  );
};
