import { useEffect, useState } from "react";
import { useLiquitySelector } from "@liquity/lib-react";
import { useLiquity } from "../../hooks/LiquityContext";

import Link from "../Link";
import Modal from "../Modal";
import { Staking } from "./views/Staking/Staking";
import { Adjusting } from "./views/Adjusting/Adjusting";
import { Active } from "./views/Active/Active";
import { Disabled } from "./views/Disabled/Disabled";
import { useFarmView } from "./context/FarmViewContext";
import { useValidationState } from "./context/useValidationState";

import classes from "./Farm.module.css";
import { Decimal, Percent } from "@liquity/lib-base";

const uniLink = lusdAddress => `https://app.uniswap.org/#/add/ETH/${lusdAddress}`;

const headSelector = ({ remainingLiquidityMiningLQTYReward, totalStakedUniTokens }) => ({
  remainingLiquidityMiningLQTYReward,
  totalStakedUniTokens
});

const Head = () => {
  const { remainingLiquidityMiningLQTYReward, totalStakedUniTokens } = useLiquitySelector(
    headSelector
  );
  const [lqtyPrice, setLqtyPrice] = useState(undefined);
  const [uniLpPrice, setUniLpPrice] = useState(undefined);
  const hasZeroValue = remainingLiquidityMiningLQTYReward.isZero || totalStakedUniTokens.isZero;

  useEffect(() => {
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=liquity,uniswap&vs_currencies=usd&include_24hr_change=true",
      {
        method: "GET"
      }
    )
      .then(res => res.json())
      .then(({ uniswap, liquity }) => {
        setLqtyPrice(liquity.usd);
        setUniLpPrice(uniswap.usd);
      })
      .catch(console.warn);
  }, []);

  if (hasZeroValue || lqtyPrice === undefined || uniLpPrice === undefined) return null;

  const remainingLqtyInUSD = remainingLiquidityMiningLQTYReward.mul(lqtyPrice);
  const totalStakedUniLpInUSD = totalStakedUniTokens.mul(uniLpPrice);
  const yieldPercentage = remainingLqtyInUSD.div(totalStakedUniLpInUSD).mul(100);

  return (
    <div className={classes.head}>
      <div className={classes.total}>
        <p className={classes.totalStaked}>LQTY remaining {remainingLqtyInUSD.shorten()}</p>
        <p className={classes.totalAPR}>yield {yieldPercentage.toString(2)}%</p>
      </div>
      <h3 className={classes.title}>
        Earn LQTY by staking <br />
        Uniswap ETH/LUSD LP tokens
      </h3>
    </div>
  );
};

const Footer = ({ addresses }) => (
  <p className={classes.footer}>
    You can obtain LP tokens by adding liquidity to the
    <br />
    <Link href={uniLink(addresses["lusdToken"])} target="_blank" className={classes.footerLink}>
      ETH/LUSD pool on Uniswap. <ion-icon name="open-outline"></ion-icon>
    </Link>
  </p>
);

const renderBody = (view, props, hasApproved, dispatchEvent) => {
  switch (view) {
    case "INACTIVE":
    case "STAKING": {
      return <Staking {...props} hasApproved={hasApproved} dispatchEvent={dispatchEvent} />;
    }
    case "ACTIVE":
    case "ADJUSTING": {
      return <Adjusting {...props} dispatchEvent={dispatchEvent} />;
    }

    case "DISABLED": {
      return <Disabled {...props} dispatchEvent={dispatchEvent} />;
    }

    default:
      return null;
  }
};

export const Farm = props => {
  const { view, dispatchEvent } = useFarmView();
  const { hasApproved } = useValidationState(Decimal.from(0));
  const {
    liquity: {
      connection: { addresses }
    }
  } = useLiquity();

  return (
    <>
      <Head />
      {renderBody(view, props, hasApproved, dispatchEvent)}
      <Footer addresses={addresses} />
    </>
  );
};
