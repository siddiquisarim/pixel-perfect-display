import { UserPlus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FamilyPerson, RelationshipType } from "@/lib/family-types";

const RELATION_LABELS: Record<RelationshipType, string> = {
  parent: "Parent",
  child: "Child",
  sibling: "Sibling",
  grandparent: "Grandparent",
  spouse: "Spouse",
};

export function AddRelativeDialog({
  trigger,
  open,
  onOpenChange,
  persons,
  onSubmit,
}: {
  trigger?: ReactNode;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  persons: FamilyPerson[];
  onSubmit: (input: {
    first_name: string;
    last_name: string;
    maiden_name: string;
    birth_year: string;
    birth_place: string;
    is_living: boolean;
    relationship_type: RelationshipType;
    anchor_person_id: string;
  }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("Johnson");
  const [maidenName, setMaidenName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [isLiving, setIsLiving] = useState(true);
  const [relation, setRelation] = useState<RelationshipType>("parent");
  const [anchor, setAnchor] = useState("p_marcus");

  const willBeMinor = isLiving && birthYear !== "" && 2026 - Number(birthYear) < 13;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-primary text-primary-foreground hover:bg-primary-deep">
            <UserPlus className="size-4" /> Add member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-paper text-paper-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a relative</DialogTitle>
          <DialogDescription>
            New records start as <em>claimed</em> until the other person confirms the link.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Relationship</Label>
              <Select value={relation} onValueChange={(v) => setRelation(v as RelationshipType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RELATION_LABELS) as RelationshipType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {RELATION_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Related to</Label>
              <Select value={anchor} onValueChange={setAnchor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {persons.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                      {p.id === "p_marcus" ? " (you)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="fn">First name</Label>
              <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ln">Last name</Label>
              <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="mn">Maiden name (optional)</Label>
              <Input id="mn" value={maidenName} onChange={(e) => setMaidenName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="by">Birth year</Label>
              <Input
                id="by"
                inputMode="numeric"
                placeholder="1956"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="bp">Birth country / city</Label>
            <Input
              id="bp"
              placeholder="Kingston, Jamaica"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div>
              <p className="text-sm font-medium">Living</p>
              <p className="text-xs text-muted-foreground">
                Living records get stronger privacy defaults.
              </p>
            </div>
            <Switch checked={isLiving} onCheckedChange={setIsLiving} />
          </div>

          {willBeMinor && (
            <div className="rounded-lg border border-border bg-secondary p-3 text-xs text-secondary-foreground">
              <Badge className="mb-2 bg-secondary-foreground text-secondary">Under 13</Badge>
              <p>
                This record will be saved as a <strong>Protected Minor Node</strong> — no invite
                links and no AI discovery.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-deep"
            disabled={!firstName.trim() || !lastName.trim()}
            onClick={() =>
              onSubmit({
                first_name: firstName,
                last_name: lastName,
                maiden_name: maidenName,
                birth_year: birthYear,
                birth_place: birthPlace,
                is_living: isLiving,
                relationship_type: relation,
                anchor_person_id: anchor,
              })
            }
          >
            <Plus className="size-4" /> Add to tree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
