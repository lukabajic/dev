import { useEffect, useRef } from "react";
import cn from "classnames";

import classes from "./StaticRow.module.css";

const StaticRow = ({
  label,
  amount,
  color,
  className,
  unit,
  oldAmount,
  oldColor,
  brackets,
  boldAmount,
  boldLabel,
  labelColor,
  scrollIntoView
}) => {
  const el = useRef(null);

  useEffect(() => {
    if (scrollIntoView) el.current.scrollIntoView({});
  }, [scrollIntoView]);

  return (
    <div className={cn(classes.staticRow, className)} ref={el}>
      <p
        className={cn(classes.staticRowlabel, {
          [classes.boldAmount]: boldLabel,
          [classes.labelPrimary]: labelColor === "primary"
        })}
      >
        {label}
      </p>
      <p className={cn(classes.staticRowAmount, classes[color])}>
        {oldAmount && <span className={classes[oldColor]}>{oldAmount}</span>}
        {oldAmount && <span> &#8594;</span>}{" "}
        <span className={cn({ [classes.boldAmount]: boldAmount })}>{amount}</span> {unit}{" "}
        {brackets && `(${brackets})`}
      </p>
    </div>
  );
};
export default StaticRow;
