"use client";

import { useState } from "react";
import {
  ArrowRightIcon,
  BellIcon,
  CaretUpDownIcon,
  CheckIcon,
  CopyIcon,
  DownloadSimpleIcon,
  FunnelIcon,
  GearIcon,
  PlusIcon,
  ShareNetworkIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Interactive specimens. Every one is the preset component; nothing is wrapped. */

export function OverlayDemos() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Watch this country</DialogTitle>
            <DialogDescription>
              MRI will re-check Burundi every week and report species that are new to the national list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Label htmlFor="watch-email">Notification address</Label>
            <Input id="watch-email" type="email" placeholder="researcher@maiyoinstitute.org" />
          </div>
          <DialogFooter>
            <Button>Start weekly watch</Button>
            <Button variant="ghost">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger>
        <SheetContent side="right" className="w-[min(24rem,calc(100vw-1rem))]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Narrow the catalogue by country, taxon and verification state.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 px-6">
            <Label htmlFor="sheet-country">Country</Label>
            <NativeSelect id="sheet-country" defaultValue="ke">
              <NativeSelectOption value="ke">Kenya</NativeSelectOption>
              <NativeSelectOption value="tz">Tanzania</NativeSelectOption>
              <NativeSelectOption value="ug">Uganda</NativeSelectOption>
            </NativeSelect>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" />}>Destructive action</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this record?</AlertDialogTitle>
            <AlertDialogDescription>
              Withdrawals are recorded in the audit trail and re-checked on the next weekly scan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep record</AlertDialogCancel>
            <AlertDialogAction>Withdraw</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Popover</PopoverTrigger>
        <PopoverContent align="start" className="w-72">
          <PopoverHeader>
            <PopoverTitle>Scan cadence</PopoverTitle>
            <PopoverDescription>
              The next scan starts at 06:00 EAT on 20 September 2026.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          Actions
          <CaretUpDownIcon data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {/* Base UI's MenuGroupLabel needs group context; wrap the label and
              its items in a group rather than leaving it loose in the popup. */}
          <DropdownMenuGroup>
            <DropdownMenuLabel>Record</DropdownMenuLabel>
              <DropdownMenuItem>
              <CopyIcon /> Copy taxon id
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <DownloadSimpleIcon /> Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ShareNetworkIcon /> Share permalink
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <TrashIcon /> Withdraw
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Notifications" />}>
          <BellIcon />
        </TooltipTrigger>
        <TooltipContent>
          3 new country-first records
        </TooltipContent>
      </Tooltip>

      <Button
        variant="outline"
        onClick={() =>
          toast.success("Watch created", {
            description: "Burundi will be re-checked every Sunday at 06:00 EAT.",
          })
        }
      >
        Show toast
      </Button>
    </div>
  );
}

export function ChoiceDemos() {
  const [notify, setNotify] = useState(true);
  const [grade, setGrade] = useState("research");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-3">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Checkbox and switch
        </p>
        <label className="flex items-center gap-3 text-xs/relaxed">
          <Checkbox defaultChecked />
          <span>Only research-grade identifications</span>
        </label>
        <label className="flex items-center gap-3 text-xs/relaxed">
          <Checkbox />
          <span>Include captive or cultivated records</span>
        </label>
        <label className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-3 text-xs/relaxed">
          <span className="grid gap-0.5">
            <span className="font-medium text-foreground">Weekly email digest</span>
            <span className="text-[0.625rem] text-muted-foreground">Sundays, 06:30 EAT</span>
          </span>
          <Switch checked={notify} onCheckedChange={setNotify} aria-label="Weekly email digest" />
        </label>
      </div>

      <div className="grid gap-3">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Radio group, select and native select
        </p>
        <RadioGroup value={grade} onValueChange={setGrade} className="grid gap-2">
          {[
            { value: "research", label: "Research grade" },
            { value: "needs-id", label: "Needs identification" },
            { value: "any", label: "Any quality grade" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-3 text-xs/relaxed">
              <RadioGroupItem value={option.value} />
              <span>{option.label}</span>
            </label>
          ))}
        </RadioGroup>

        <Select defaultValue="ke">
          <SelectTrigger className="w-full" aria-label="Country">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ke">Kenya</SelectItem>
            <SelectItem value="tz">Tanzania</SelectItem>
            <SelectItem value="ug">Uganda</SelectItem>
            <SelectItem value="rw">Rwanda</SelectItem>
          </SelectContent>
        </Select>

        <NativeSelect defaultValue="birds" aria-label="Taxon">
          <NativeSelectOption value="birds">Birds</NativeSelectOption>
          <NativeSelectOption value="plants">Plants</NativeSelectOption>
          <NativeSelectOption value="insects">Insects</NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  );
}

export function TabDemos() {
  return (
    <Tabs defaultValue="cumulative">
      <TabsList>
        <TabsTrigger value="cumulative">Cumulative</TabsTrigger>
        <TabsTrigger value="annual">Annual</TabsTrigger>
        <TabsTrigger value="country">By country</TabsTrigger>
      </TabsList>
      <TabsContent value="cumulative">
        <p className="rounded-md bg-muted/40 p-3 text-xs/relaxed text-muted-foreground">
          Cumulative species documented per country since the first archived checklist.
        </p>
      </TabsContent>
      <TabsContent value="annual">
        <p className="rounded-md bg-muted/40 p-3 text-xs/relaxed text-muted-foreground">
          Species added each year — a different question from cumulative totals.
        </p>
      </TabsContent>
      <TabsContent value="country">
        <p className="rounded-md bg-muted/40 p-3 text-xs/relaxed text-muted-foreground">
          One series per monitored country, capped at three series to stay readable.
        </p>
      </TabsContent>
    </Tabs>
  );
}

export function DisclosureDemos() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Accordion defaultValue={["taxonomy"]}>
        <AccordionItem value="taxonomy">
          <AccordionTrigger>How is taxonomy resolved?</AccordionTrigger>
          <AccordionContent>
            <p className="text-xs/relaxed text-muted-foreground">
              Names are reconciled against AviList, then matched to eBird species codes so media counts and
              checklists line up across providers.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="coverage">
          <AccordionTrigger>What does “documented” mean?</AccordionTrigger>
          <AccordionContent>
            <p className="text-xs/relaxed text-muted-foreground">
              Documented means catalogued, not abundant. A country can have few records and a healthy
              population — coverage and abundance are different measures.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Collapsible defaultOpen>
        <CollapsibleTrigger
          render={
            <Button variant="outline" size="sm" className="w-full justify-between">
              Advanced filters
              <FunnelIcon data-icon="inline-end" />
            </Button>
          }
        />
        <CollapsibleContent className="pt-3">
          <div className="grid gap-3 rounded-md bg-muted/40 p-3">
            <label className="grid gap-1.5 text-xs/relaxed">
              <span className="text-muted-foreground">Observer login</span>
              <Input placeholder="bertogcliment" />
            </label>
            <label className="grid gap-1.5 text-xs/relaxed">
              <span className="text-muted-foreground">Notes</span>
              <Textarea rows={3} placeholder="Anything the next reviewer should know…" />
            </label>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function FeedbackDemos() {
  const [progress, setProgress] = useState(62);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid content-start gap-3">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Progress
        </p>
        <Progress value={progress}>
          <span className="text-xs/relaxed font-medium text-foreground">Weekly scan</span>
          <span className="ml-auto text-xs/relaxed tabular-nums text-muted-foreground">
            {progress}%
          </span>
        </Progress>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setProgress((value) => Math.max(0, value - 10))}>
            Less
          </Button>
          <Button size="sm" variant="outline" onClick={() => setProgress((value) => Math.min(100, value + 10))}>
            More
          </Button>
        </div>
      </div>

      <div className="grid content-start gap-3">
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Avatars and status
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Avatar>
            <AvatarImage src="" alt="" />
            <AvatarFallback>KS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>BC</AvatarFallback>
          </Avatar>
          <Badge variant="secondary">Monitoring</Badge>
          <Badge variant="destructive">Withdrawn</Badge>
          <Badge variant="outline">Stable</Badge>
          <Badge>
            <CheckIcon /> Verified
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">
            <PlusIcon data-icon="inline-start" />
            Add watch
          </Button>
          <Button size="sm" variant="outline" disabled>
            <GearIcon data-icon="inline-start" />
            Disabled
          </Button>
          <Button size="sm" variant="link">
            Read the method
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
