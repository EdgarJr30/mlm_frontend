import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Assignee, AssigneeSection } from '../types/Assignee';
import {
  getActiveAssignees,
  groupBySection,
  makeAssigneeMap,
} from '../services/assigneeService';
import { useAuth } from './AuthContext';

export type AssigneeState = {
  loading: boolean;
  error: string | null;
  list: Assignee[];
  byId: Record<number, Assignee>;
  bySection: Record<AssigneeSection, Assignee[]>;
  refresh: () => Promise<void>;
};

const AssigneeContext = createContext<AssigneeState | undefined>(undefined);

export const AssigneeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<Assignee[]>([]);
  const hydratedRef = useRef(false);

  const refresh = async () => {
    setError(null);
    const firstLoad = !hydratedRef.current;
    if (firstLoad) setLoading(true);
    try {
      if (!isAuthenticated) {
        setList([]);
        return;
      }
      const data = await getActiveAssignees();
      setList(data);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Error cargando responsables';
      setError(msg);
      console.error(msg);
    } finally {
      if (!hydratedRef.current) {
        hydratedRef.current = true;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void refresh();
  }, [isAuthenticated]);

  const value = useMemo<AssigneeState>(
    () => ({
      loading,
      error,
      list,
      byId: makeAssigneeMap(list),
      bySection: groupBySection(list),
      refresh,
    }),
    [loading, error, list]
  );

  return (
    <AssigneeContext.Provider value={value}>
      {children}
    </AssigneeContext.Provider>
  );
};

export function useAssignees() {
  const ctx = useContext(AssigneeContext);
  if (!ctx)
    throw new Error('useAssignees must be used within AssigneeProvider');
  return ctx;
}
