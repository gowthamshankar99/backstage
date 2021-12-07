/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import clsx from 'clsx';
import React, { useState, useContext, PropsWithChildren, useRef } from 'react';
import { sidebarConfig, SidebarContext } from './config';
import { BackstageTheme } from '@backstage/theme';
import { SidebarPinStateContext } from './Page';
import { MobileSidebar } from './MobileSidebar';
import DoubleArrowRight from './icons/DoubleArrowRight';
import DoubleArrowLeft from './icons/DoubleArrowLeft';

export type SidebarClassKey = 'drawer' | 'drawerOpen';

const useStyles = makeStyles<BackstageTheme>(
  theme => ({
    drawer: {
      display: 'flex',
      flexFlow: 'column nowrap',
      alignItems: 'flex-start',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 1000,
      background: theme.palette.navigation.background,
      overflowX: 'hidden',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      width: sidebarConfig.drawerWidthClosed,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shortest,
      }),
      '& > *': {
        flexShrink: 0,
      },
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
    expandButton: {
      background: 'none',
      border: 'none',
      color: theme.palette.navigation.color,
      width: '100%',
      cursor: 'pointer',
      position: 'relative',
      height: 48,
    },
    arrows: {
      position: 'absolute',
      right: 10,
    },
    drawerOpen: {
      width: sidebarConfig.drawerWidthOpen,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shorter,
      }),
    },
  }),
  { name: 'BackstageSidebar' },
);

enum State {
  Closed,
  Idle,
  Open,
}

type Props = {
  openDelayMs?: number;
  closeDelayMs?: number;
  disableExpandOnHover?: boolean;
};

const DesktopSidebar = ({
  openDelayMs = sidebarConfig.defaultOpenDelayMs,
  closeDelayMs = sidebarConfig.defaultCloseDelayMs,
  children,
}: PropsWithChildren<Props>) => {
  const classes = useStyles();
  const isSmallScreen = useMediaQuery<BackstageTheme>(theme =>
    theme.breakpoints.down('md'),
  );
  const [state, setState] = useState(State.Closed);
  const hoverTimerRef = useRef<number>();
  const { isPinned } = useContext(SidebarPinStateContext);

  const handleOpen = () => {
    if (isPinned) {
      return;
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = undefined;
    }
    if (state !== State.Open && !isSmallScreen) {
      hoverTimerRef.current = window.setTimeout(() => {
        hoverTimerRef.current = undefined;
        setState(State.Open);
      }, openDelayMs);

      setState(State.Idle);
    }
  };

  const handleClose = () => {
    if (isPinned) {
      return;
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = undefined;
    }
    if (state === State.Idle) {
      setState(State.Closed);
    } else if (state === State.Open) {
      hoverTimerRef.current = window.setTimeout(() => {
        hoverTimerRef.current = undefined;
        setState(State.Closed);
      }, closeDelayMs);
    }
  };

  const isOpen = (state === State.Open && !isSmallScreen) || isPinned;

  // TODO: Generalize
  const setOpen = (open: boolean) => {
    if (open) {
      handleOpen();
    } else {
      handleClose();
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        setOpen,
      }}
    >
      <div
        onMouseEnter={handleOpen}
        onFocus={handleOpen}
        onMouseLeave={handleClose}
        onBlur={handleClose}
        data-testid="sidebar-root"
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: isOpen,
        })}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children }: React.PropsWithChildren<Props>) => {
  const isMobileScreen = useMediaQuery<BackstageTheme>(theme =>
    theme.breakpoints.down('xs'),
  );

  // TODO: Generalize
  const setOpen = () => {};

  return isMobileScreen ? (
    <SidebarContext.Provider
      value={{
        isOpen: true,
        setOpen,
      }}
    >
      <MobileSidebar>{children}</MobileSidebar>
    </SidebarContext.Provider>
  ) : (
    <DesktopSidebar>{children}</DesktopSidebar>
  );
};

/**
 * A button which allows you to expand the sidebar when clicked.
 * Use optionally to replace sidebar's expand-on-hover feature with expand-on-click.
 *
 * @public
 */
export const SidebarExpandButton = () => {
  const classes = useStyles();
  const { isOpen, setOpen } = useContext(SidebarContext);
  const { isPinned } = useContext(SidebarPinStateContext);
  const isSmallScreen = useMediaQuery<BackstageTheme>(theme =>
    theme.breakpoints.down('md'),
  );

  const handleClick = () => {
    setOpen(!isOpen);
  };

  if (isPinned || isSmallScreen) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={classes.expandButton}
      aria-label="Expand Sidebar"
      data-testid="sidebar-expand-button"
    >
      <div className={classes.arrows}>
        {isOpen ? <DoubleArrowLeft /> : <DoubleArrowRight />}
      </div>
    </button>
  );
};
