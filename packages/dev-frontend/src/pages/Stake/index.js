import { useState } from "react";

import Tabs from "../../components/Tabs";

const TABS = [
  { tab: "lqty", content: "Stake LQTY" },
  { tab: "unilp", content: "Stake UNI LP " }
];

const TroveScreen = () => {
  const [activeTab, setActiveTab] = useState("lqty");

  return (
    <>
      <Tabs activeTab={activeTab} tabs={TABS} setActiveTab={setActiveTab} />
    </>
  );
};

export default TroveScreen;
