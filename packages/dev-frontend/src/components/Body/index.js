import classes from "./Body.module.css";

import { backgroundImage } from "../../images";

import Footer from "../Footer";

const Body = ({ children }) => (
  <div className={classes.wrapper}>
    <div className={classes.background} style={{ backgroundImage: `url(${backgroundImage})` }} />
    <div className={classes.children}>{children}</div>
    <Footer />
  </div>
);

export default Body;
