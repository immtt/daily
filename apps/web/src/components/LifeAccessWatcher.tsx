import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isLifeEcosystemRoute, lockLife } from "../lib/lifeAccess";

/** 离开生活栏目范围时自动清除解锁状态 */
export function LifeAccessWatcher() {
  const location = useLocation();

  useEffect(() => {
    if (!isLifeEcosystemRoute(location.pathname, location.search)) {
      lockLife();
    }
  }, [location.pathname, location.search]);

  return null;
}
