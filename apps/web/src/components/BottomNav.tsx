import { NavLink } from "react-router-dom";
import "./BottomNav.css";

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="メイン">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          "bottom-nav__link" + (isActive ? " bottom-nav__link--active" : "")
        }
      >
        <span className="bottom-nav__icon" aria-hidden>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="bottom-nav__label">在庫</span>
      </NavLink>
      <NavLink
        to="/movements"
        className={({ isActive }) =>
          "bottom-nav__link" + (isActive ? " bottom-nav__link--active" : "")
        }
      >
        <span className="bottom-nav__icon" aria-hidden>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 7h10M7 12h10M7 17h10M4 7h.01M4 12h.01M4 17h.01"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="bottom-nav__label">入出庫</span>
      </NavLink>
    </nav>
  );
}
