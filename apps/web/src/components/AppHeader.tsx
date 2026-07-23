import type { ReactNode } from "react";
import { UserMenu } from "./UserMenu";

type Props = {
  left?: ReactNode;
  center?: ReactNode;
  showUserMenu?: boolean;
};

export function AppHeader({ left, center, showUserMenu = true }: Props) {
  return (
    <header className="app-header">
      <div className="app-header-left">{left}</div>
      <div className="app-header-center">{center}</div>
      <div className="app-header-right">{showUserMenu ? <UserMenu /> : null}</div>
    </header>
  );
}
