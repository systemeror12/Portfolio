import React from "react";

function navigate(to: string) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

type InternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
};

export function InternalLink({ to, children, ...props }: InternalLinkProps) {
  return (
    <a
      href={to}
      {...props}
      onClick={(event) => {
        props.onClick?.(event);

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        navigate(to);

        const target = to.split("#")[1];
        if (target) {
          requestAnimationFrame(() =>
            document.getElementById(target)?.scrollIntoView(),
          );
        } else {
          window.scrollTo(0, 0);
        }
      }}
    >
      {children}
    </a>
  );
}
