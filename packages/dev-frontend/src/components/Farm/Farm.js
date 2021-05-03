import { useEffect, useState } from "react";
import { useLiquitySelector } from "@liquity/lib-react";
import { useLiquity } from "../../hooks/LiquityContext";

import Link from "../Link";
import Modal from "../Modal";
import { Inactive } from "./views/Inactive/Inactive";
import { Staking } from "./views/Staking/Staking";
import { Adjusting } from "./views/Adjusting/Adjusting";
import { Active } from "./views/Active/Active";
import { Disabled } from "./views/Disabled/Disabled";
import { useFarmView } from "./context/FarmViewContext";
import { fetchPrices } from "./context/fetchPrices";
import { useValidationState } from "./context/useValidationState";

import classes from "./Farm.module.css";
import { Decimal } from "@liquity/lib-base";

const uniLink = lusdAddress => `https://app.uniswap.org/#/add/ETH/${lusdAddress}`;

const headSelector = ({ remainingLiquidityMiningLQTYReward, totalStakedUniTokens }) => ({
  remainingLiquidityMiningLQTYReward,
  totalStakedUniTokens
});

const Head = () => {
  const {
    liquity: {
      connection: { addresses, liquidityMiningLQTYRewardRate }
    }
  } = useLiquity();

  const { remainingLiquidityMiningLQTYReward, totalStakedUniTokens } = useLiquitySelector(
    headSelector
  );
  const [lqtyPrice, setLqtyPrice] = useState(undefined);
  const [uniLpPrice, setUniLpPrice] = useState(undefined);
  const hasZeroValue = remainingLiquidityMiningLQTYReward.isZero || totalStakedUniTokens.isZero;
  const lqtyTokenAddress = addresses["lqtyToken"];
  const uniTokenAddress = addresses["uniToken"];
  const secondsRemaining = remainingLiquidityMiningLQTYReward.div(liquidityMiningLQTYRewardRate);
  const daysRemaining = secondsRemaining.div(60 * 60 * 24);

  useEffect(() => {
    (async () => {
      try {
        const { lqtyPriceUSD, uniLpPriceUSD } = await fetchPrices(lqtyTokenAddress, uniTokenAddress);
        setLqtyPrice(lqtyPriceUSD);
        setUniLpPrice(uniLpPriceUSD);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [lqtyTokenAddress, uniTokenAddress]);

  if (hasZeroValue || lqtyPrice === undefined || uniLpPrice === undefined) return null;

  const remainingLqtyInUSD = remainingLiquidityMiningLQTYReward.mul(lqtyPrice);
  const totalStakedUniLpInUSD = totalStakedUniTokens.mul(uniLpPrice);
  const yieldPercentage = remainingLqtyInUSD.div(totalStakedUniLpInUSD).mul(100);

  return (
    <div className={classes.head}>
      <div className={classes.total}>
        <p className={classes.totalStaked}>LQTY remaining {remainingLqtyInUSD.prettify(0)}k</p>
        <p className={classes.totalAPR}>APR {yieldPercentage.prettify(0)}</p>
      </div>
      <h3 className={classes.title}>
        Earn LQTY by staking <br />
        Uniswap ETH/LUSD LP tokens
      </h3>
    </div>
  );
};

const selector = ({ remainingLiquidityMiningLQTYReward }) => ({
  remainingLiquidityMiningLQTYReward
});

const InactiveHead = () => {
  const { remainingLiquidityMiningLQTYReward } = useLiquitySelector(selector);

  return (
    <div className={classes.head}>
      <div className={classes.total}>
        <p className={classes.totalStaked}>
          LQTY remaining {remainingLiquidityMiningLQTYReward.div(1000).prettify(0)}k
        </p>
        <p className={classes.totalAPR}>yield &mdash;</p>
      </div>
      <h3 className={classes.title}>
        To stake your UNI LP tokens you need to allow Liquity to stake them for you
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

const renderHead = (view, hasApproved) => {
  switch (view) {
    case "INACTIVE":
      return <InactiveHead />;
    case "STAKING":
      return <InactiveHead />;
    case "ADJUSTING":
    case "ACTIVE":
    case "DISABLED":
      break;

    default:
      return null;
  }
};

const renderBody = (view, props, hasApproved) => {
  switch (view) {
    case "INACTIVE":
    case "STAKING": {
      return <Staking {...props} hasApproved={hasApproved} />;
    }
    case "ADJUSTING": {
      return <Adjusting {...props} />;
    }
    case "ACTIVE": {
      return <Active {...props} />;
    }
    case "DISABLED": {
      return <Disabled {...props} />;
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

  useEffect(() => {
    dispatchEvent("STAKE_PRESSED");
  }, [dispatchEvent]);

  return (
    <>
      {renderHead(view, hasApproved)}
      {renderBody(view, props, hasApproved)}
      <Footer addresses={addresses} />
    </>
  );
};
