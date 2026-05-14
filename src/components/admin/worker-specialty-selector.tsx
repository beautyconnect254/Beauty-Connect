import { Badge } from "@/components/ui/badge";
import type { RoleSpecialtyCatalog } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WorkerSpecialtySelectorProps {
  roleCatalog: RoleSpecialtyCatalog[];
  selectedSkillIds: string[];
  onToggleSkill: (skillId: string) => void;
  className?: string;
}

export function WorkerSpecialtySelector({
  roleCatalog,
  selectedSkillIds,
  onToggleSkill,
  className,
}: WorkerSpecialtySelectorProps) {
  return (
    <div className={cn("grid gap-3", className)}>
      {roleCatalog.map((role) => {
        const selectedCount = role.specialties.filter((skill) =>
          selectedSkillIds.includes(skill.id),
        ).length;

        return (
          <section
            key={role.role}
            className="rounded-md border border-[color:var(--border)] bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-[color:var(--foreground)]">
                  {role.role}
                </p>
                <p className="text-[11px] font-bold text-[color:var(--muted-foreground)]">
                  {selectedCount} selected
                </p>
              </div>
              {selectedCount > 0 ? (
                <Badge variant="verified">{selectedCount}</Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {role.specialties.length > 0 ? (
                role.specialties.map((skill) => {
                  const active = selectedSkillIds.includes(skill.id);

                  return (
                    <button
                      type="button"
                      key={skill.id}
                      onClick={() => onToggleSkill(skill.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-extrabold transition",
                        active
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-white shadow-sm"
                          : "border-[color:var(--border)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]",
                      )}
                    >
                      {skill.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  No sub-specialties yet.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
