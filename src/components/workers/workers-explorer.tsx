"use client";

import { useDeferredValue, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { WorkerCard } from "@/components/workers/worker-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { workerExperienceMonths } from "@/lib/experience";
import type { SkillRecord, Worker } from "@/lib/types";

interface WorkersExplorerProps {
  workers: Worker[];
  skills: SkillRecord[];
  locations: string[];
  initialRole?: string;
}

interface FilterState {
  selectedRole: string;
  selectedSkill: string;
  selectedLocation: string;
  availability: string;
  minExperience: string;
  sortBy: string;
  verifiedOnly: boolean;
}

function createDefaultFilters(initialRole?: string): FilterState {
  return {
    selectedRole: initialRole ?? "all",
    selectedSkill: "all",
    selectedLocation: "All locations",
    availability: "all",
    minExperience: "0",
    sortBy: "featured",
    verifiedOnly: true,
  };
}

export function WorkersExplorer({
  workers,
  skills,
  locations,
  initialRole,
}: WorkersExplorerProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(() => createDefaultFilters(initialRole));
  const [draftFilters, setDraftFilters] = useState(() =>
    createDefaultFilters(initialRole),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const deferredSearch = useDeferredValue(search);
  const roles = Array.from(new Set(workers.map((worker) => worker.primary_role)));
  const activeFilterCount = [
    filters.selectedRole !== "all",
    filters.selectedSkill !== "all",
    filters.selectedLocation !== "All locations",
    filters.availability !== "all",
    filters.minExperience !== "0",
    filters.sortBy !== "featured",
    !filters.verifiedOnly,
  ].filter(Boolean).length;

  function openFilters() {
    setDraftFilters(filters);
    setFiltersOpen(true);
  }

  function clearFilters() {
    const nextFilters = createDefaultFilters(initialRole);

    setDraftFilters(nextFilters);
    setFilters(nextFilters);
    setFiltersOpen(false);
  }

  function applyFilters() {
    setFilters(draftFilters);
    setFiltersOpen(false);
  }

  const filteredWorkers = workers
    .filter((worker) => {
      const query = deferredSearch.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        worker.full_name.toLowerCase().includes(query) ||
        worker.primary_role.toLowerCase().includes(query) ||
        worker.location.toLowerCase().includes(query) ||
        worker.skills.some((skill) => skill.name.toLowerCase().includes(query));

      const matchesRole =
        filters.selectedRole === "all" || worker.primary_role === filters.selectedRole;

      const matchesSkill =
        filters.selectedSkill === "all" ||
        worker.skills.some((skill) => skill.id === filters.selectedSkill);

      const matchesLocation =
        filters.selectedLocation === "All locations" ||
        worker.location === filters.selectedLocation;

      const matchesAvailability =
        filters.availability === "all" ||
        worker.availability_status === filters.availability;

      const matchesExperience =
        workerExperienceMonths(worker) >= Number(filters.minExperience);

      const matchesVerification =
        !filters.verifiedOnly || worker.verification_status === "verified";

      return (
        matchesSearch &&
        matchesRole &&
        matchesSkill &&
        matchesLocation &&
        matchesAvailability &&
        matchesExperience &&
        matchesVerification
      );
    })
    .sort((left, right) => {
      if (filters.sortBy === "experience") {
        return workerExperienceMonths(right) - workerExperienceMonths(left);
      }

      if (filters.sortBy === "salary-low") {
        return left.salary_expectation - right.salary_expectation;
      }

      if (left.featured === right.featured) {
        return workerExperienceMonths(right) - workerExperienceMonths(left);
      }

      return Number(right.featured) - Number(left.featured);
    });

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-2.5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[color:var(--muted-foreground)]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="h-9 pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
              onClick={openFilters}
              aria-label="Open worker filters"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 ? (
                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--foreground)] px-1 text-[10px] font-extrabold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </div>
          <p className="mt-2 text-xs font-bold text-[color:var(--muted-foreground)]">
            {filteredWorkers.length} match{filteredWorkers.length === 1 ? "" : "es"}
          </p>
        </CardContent>
      </Card>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/35 px-3 py-[calc(env(safe-area-inset-bottom)+1rem)] sm:items-center sm:justify-center">
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[color:var(--border)] p-4">
              <div>
                <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
                  Filter workers
                </h2>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  Choose the worker details you want to match.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-md p-2 hover:bg-[color:var(--muted)]"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 overflow-y-auto p-4">
              <FilterField label="Role">
                <Select
                  value={draftFilters.selectedRole}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      selectedRole: event.target.value,
                    }))
                  }
                >
                  <option value="all">All roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </FilterField>

              <FilterField label="Skill">
                <Select
                  value={draftFilters.selectedSkill}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      selectedSkill: event.target.value,
                    }))
                  }
                >
                  <option value="all">All skills</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </Select>
              </FilterField>

              <FilterField label="Location">
                <Select
                  value={draftFilters.selectedLocation}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      selectedLocation: event.target.value,
                    }))
                  }
                >
                  <option>All locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </Select>
              </FilterField>

              <div className="grid gap-3 sm:grid-cols-2">
                <FilterField label="Availability">
                  <Select
                    value={draftFilters.availability}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        availability: event.target.value,
                      }))
                    }
                  >
                    <option value="all">Any availability</option>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="hired">Hired</option>
                  </Select>
                </FilterField>

                <FilterField label="Experience">
                  <Select
                    value={draftFilters.minExperience}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        minExperience: event.target.value,
                      }))
                    }
                  >
                    <option value="0">Any experience</option>
                    <option value="6">6+ months</option>
                    <option value="12">1+ year</option>
                    <option value="24">2+ years</option>
                    <option value="48">4+ years</option>
                    <option value="72">6+ years</option>
                  </Select>
                </FilterField>
              </div>

              <FilterField label="Sort">
                <Select
                  value={draftFilters.sortBy}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      sortBy: event.target.value,
                    }))
                  }
                >
                  <option value="featured">Featured first</option>
                  <option value="experience">Highest experience</option>
                  <option value="salary-low">Lowest salary</option>
                </Select>
              </FilterField>

              <label className="flex items-center justify-between gap-4 rounded-md border border-[color:var(--border)] bg-white px-3 py-2.5 text-sm font-extrabold text-[color:var(--foreground)]">
                Verified workers only
                <input
                  checked={draftFilters.verifiedOnly}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      verifiedOnly: event.target.checked,
                    }))
                  }
                  type="checkbox"
                  className="h-4 w-4 rounded border-[color:var(--border)] accent-[color:var(--primary)]"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-[color:var(--border)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
              <Button onClick={applyFilters}>Apply</Button>
            </div>
          </div>
        </div>
      ) : null}

      {filteredWorkers.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredWorkers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} compact />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-extrabold text-[color:var(--foreground)]">
              No workers match those filters yet
            </p>
            <p className="mt-2 text-sm leading-5 text-[color:var(--muted-foreground)]">
              Try widening location or availability to see more verified workers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FilterField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-extrabold text-[color:var(--foreground)]">
        {label}
      </label>
      {children}
    </div>
  );
}
