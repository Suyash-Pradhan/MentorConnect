
"use client";

import type { Profile } from "@/types";
import * as React from "react";

interface UserProfileContextType {
  userProfile: Profile | null;
  profileLoading: boolean;
  profileError: any | null;
  refetchUserProfile: ()  => Promise<void>;
}

export const UserProfileContext = React.createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = (): UserProfileContextType => {
  const context = React.useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};
