import { useState, useEffect, useCallback } from "react";
import cn from "classnames";

import { useLiquitySelector } from "@liquity/lib-react";

import { InfoIcon } from "../InfoIcon";

import { COIN, GT, ETH } from "../../strings";
import { lusdIcon, lqtyIcon, ethereumIcon } from "../../images";

import classes from "./PriceManager.module.css";

const DATA = {
  liquity: {
    order: 2,
    currency: GT,
    icon: lqtyIcon
  },
  "liquity-usd": {
    order: 1,
    currency: COIN,
    icon: lusdIcon
  },
  ethereum: {
    order: 0,
    currency: ETH,
    icon: ethereumIcon
  }
};

const DataRow = ({ currency, percentage, increase, amount, icon, tooltip }) => (
  <div className={classes.item}>
    <div className={classes.row}>
      <div className={classes.currency}>
        {currency}
        {tooltip && <InfoIcon tooltip={tooltip} />}
      </div>
      <div className={classes.icon}>
        <img src={icon} alt={currency} className={classes.iconImage} />
      </div>
    </div>
    <div className={classes.row}>
      <div className={classes.amount}>${amount}</div>
      {percentage && <div className={classes.percentage}>{percentage}%</div>}
      {increase !== undefined && (
        <div
          className={cn(classes.change, {
            [classes.decrease]: !increase
          })}
        >
          <ion-icon name="caret-up-outline"></ion-icon>
        </div>
      )}
    </div>
  </div>
);

const select = ({ price }) => ({ price });

const MS_IN_5_MINUTES = 1000 * 60 * 5;

const PriceManager = () => {
  const { price } = useLiquitySelector(select);
  const [data, setData] = useState(null);

  const fetchData = useCallback(
    () =>
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=liquity,ethereum,liquity-usd&vs_currencies=usd&include_24hr_change=true",
        {
          method: "GET"
        }
      )
        .then(res => res.json())
        .then(setData)
        .catch(console.warn),
    []
  );

  useEffect(() => {
    fetchData();

    const id = setInterval(() => {
      fetchData();
    }, MS_IN_5_MINUTES);

    return () => {
      clearInterval(id);
    };
  }, [fetchData]);

  if (!data) return null;

  return (
    <div className={cn(classes.wrapper, "slide-in-left")}>
      <DataRow
        key={ETH}
        currency={ETH}
        icon={ethereumIcon}
        amount={price.prettify(2)}
        tooltip="Oracle price"
      />
      {Object.keys(data)
        .sort((a, b) => DATA[a].order - DATA[b].order)
        .map(c => (
          <DataRow
            key={c}
            currency={DATA[c].currency}
            icon={DATA[c].icon}
            percentage={data[c].usd_24h_change.toFixed(1).toString().replace("-", "")}
            increase={data[c].usd_24h_change > 0}
            amount={data[c].usd.toFixed(2)}
          />
        ))}
    </div>
  );
};

export default PriceManager;
