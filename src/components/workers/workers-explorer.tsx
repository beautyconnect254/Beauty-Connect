"use client";

import { useDeferredValue, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { WorkerCard } from "@/components/workers/worker-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SkillRecord, Worker } from "@/lib/types";

interface WorkersExplorerProps {
  workers: Worker[];
  skills: SkillRecord[];
  locations: string[];
  initialRole?: string;
}

export function WorkersExplorer({
  workers,
  skills,
  locations,
  initialRole,
}: WorkersExplorerProps) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState(initialRole ?? "all");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("All locations");
  const [availability, setAvailability] = useState("all");
  const [minExperience, setMinExperience] = useState("0");
  const [sortBy, setSortBy] = useState("featured");
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const deferredSearch = useDeferredValue(search);

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
        selectedRole === "all" || worker.primary_role === selectedRole;

      const matchesSkill =
        selectedSkill === "all" ||
        worker.skills.some((skill) => skill.id === selectedSkill);

      const matchesLocation =
        selectedLocation === "All locations" ||
        worker.location === selectedLocation;

      const matchesAvailability =
        availability === "all" || worker.availability_status === availability;

      const matchesExperience =
        worker.years_of_experience >= Number(minExperience);

      const matchesVerification =
        !verifiedOnly || worker.verification_status === "verified";

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
      if (sortBy === "experience") {
        return right.years_of_experience - left.years_of_experience;
      }

      if (sortBy === "salary-low") {
        return left.salary_expectation - right.salary_expectation;
      }

      if (left.featured === right.featured) {
        return right.years_of_experience - left.years_of_experience;
      }

      return Number(right.featured) - Number(left.featured);
    });

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="space-y-2.5 p-2.5">
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1.3fr)_repeat(3,minmax(130px,1fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[color:var(--muted-foreground)]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="h-9 pl-9"
              />
            </div>
            <Select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="h-9"
            >
              <option value="all">All roles</option>
              {Array.from(new Set(workers.map((worker) => worker.primary_role))).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
            <Select
              value={selectedSkill}
              onChange={(event) => setSelectedSkill(event.target.value)}
              className="h-9"
            >
              <option value="all">All skills</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </Select>
            <Select
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
              className="h-9"
            >
              <option>All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[color:var(--muted)] px-2.5 text-xs font-extrabold text-[color:var(--foreground)]">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {filteredWorkers.length} match{filteredWorkers.length === 1 ? "" : "es"}
            </span>
            <Select
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="h-8 w-36 text-xs"
            >
              <option value="all">Any availability</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="hired">Hired</option>
            </Select>
            <Select
              value={minExperience}
              onChange={(event) => setMinExperience(event.target.value)}
              className="h-8 w-32 text-xs"
            >
              <option value="0">Any exp.</option>
              <option value="2">2+ years</option>
              <option value="4">4+ years</option>
              <option value="6">6+ years</option>
              <option value="8">8+ years</option>
            </Select>
            <Select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-8 w-40 text-xs"
            >
              <option value="featured">Featured first</option>
              <option value="experience">Highest exp.</option>
              <option value="salary-low">Lowest salary</option>
            </Select>
            <label className="inline-flex h-8 items-center gap-2 rounded-md border border-[color:var(--border)] bg-white px-2.5 text-xs font-extrabold text-[color:var(--foreground)]">
              Verified
              <input
                checked={verifiedOnly}
                onChange={(event) => setVerifiedOnly(event.target.checked)}
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-[color:var(--border)] accent-[color:var(--primary)]"
              />
            </label>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedRole("all");
                setSelectedSkill("all");
                setSelectedLocation("All locations");
                setAvailability("all");
                setMinExperience("0");
                setSortBy("featured");
                setVerifiedOnly(true);
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

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
