import { useState, useEffect } from "react";

import useTroveView from "../../components/TroveWidget/context/TroveViewContext";
import Tabs from "../../components/Tabs";
import TroveHead from "../../components/TroveWidget/TroveHead";
import TroveWidget from "../../components/TroveWidget";
import Redemption from "../../components/Redemption/Redemption";

const TABS = [
  { tab: "deposit", content: "Deposit" },
  { tab: "withdraw", content: "Withdraw" },
  { tab: "redemption", content: "Redemption" }
];

let presistActiveTab = null;

const TroveScreen = () => {
  const [activeTab, setActiveTab] = useState(presistActiveTab || "deposit");
  const { dispatchEvent, view } = useTroveView();

  useEffect(() => {
    presistActiveTab = activeTab;
  }, [activeTab]);

  return (
    <>
      <TroveHead view={view} dispatchEvent={dispatchEvent} />

      <Tabs activeTab={activeTab} tabs={TABS} setActiveTab={setActiveTab} />

      {activeTab === "redemption" ? (
        <Redemption />
      ) : (
        <TroveWidget activeTab={activeTab} view={view} dispatchEvent={dispatchEvent} />
      )}
    </>
  );
};

export default TroveScreen;
