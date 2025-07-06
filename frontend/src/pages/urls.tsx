import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartBar, Pencil, Plus, Trash } from "lucide-react";

type URL = {
  id: number;
  name: string;
  url: string;
};

async function deleteURL(id: number) {
  const resp = await fetch(
    "/api/url?action=delete&id=" + encodeURIComponent(id)
  );
  resp.json().then((msg) => {
    if (!(String(msg.msg) === "URL deleted.")) {
      console.error("Error deleting the url");
    }
  });
}

async function getURLS(): Promise<URL[]> {
  const res = await fetch("/api/get-urls");
  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }
  return [];
}

async function addURL(name: string, url: string): Promise<void> {
  await fetch(
    "/api/url?action=add&name=" +
      encodeURIComponent(name) +
      "&url=" +
      encodeURIComponent(url)
  );
}

export default function URLSPage() {
  const [data, setData] = useState<URL[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<URL | null>(null);

  useEffect(() => {
    getURLS().then(setData);
  }, []);

  const toggleRow = (id: number) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const isAllSelected = data.length > 0 && selected.size === data.length;

  const toggleAll = () => {
    setSelected((prev) =>
      isAllSelected ? new Set() : new Set(data.map((item) => item.id))
    );
  };

  const handleDelete = () => {
    const toDelete = data.filter((item) => selected.has(item.id));
    toDelete.forEach((item) => deleteURL(item.id));
    setData((prev) => prev.filter((item) => !selected.has(item.id)));
    setSelected(new Set());
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold">Manage Tracked URLs</h1>
        <div className="gap-4 flex flex-row">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mx-5">
                <Plus /> Add URL
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get("name") as string;
                  const url = formData.get("url") as string;

                  await addURL(name, url);
                  setData((prev) => [
                    ...prev,
                    {
                      id: Math.max(0, ...prev.map((x) => x.id)) + 1,
                      name,
                      url,
                    },
                  ]);
                }}
              >
                <DialogHeader>
                  <DialogTitle>ADD URL</DialogTitle>
                  <DialogDescription>
                    Add URL to track downtime of!
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">URL</Label>
                    <Input id="url" name="url" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button type="submit">Add URL</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={selected.size === 0}
          >
            <Trash /> Delete Selected
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              data-state={selected.has(item.id) ? "selected" : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={() => toggleRow(item.id)}
                  aria-label={`Select row ${item.id}`}
                />
              </TableCell>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.url}</TableCell>
              <TableCell>
                <Dialog>
                  <div className="flex flex-row items-center justify-center">
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="mx-4 float-right"
                        onClick={() => setEditing(item)}
                      >
                        <Pencil />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <a href={`/data?url=${encodeURIComponent(item.url)}`}>
                      <Button variant="secondary">
                        <ChartBar /> View Downtimes
                      </Button>
                    </a>
                  </div>
                  <DialogContent className="sm:max-w-[425px]">
                    {editing && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const updatedName = formData.get("name") as string;
                          const updatedUrl = formData.get("url") as string;
                          setData((prev) =>
                            prev.map((d) =>
                              d.id === editing.id
                                ? { ...d, name: updatedName, url: updatedUrl }
                                : d
                            )
                          );

                          setEditing(null);
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle>Edit URL</DialogTitle>
                          <DialogDescription>
                            Update the URL information and save your changes.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              name="name"
                              defaultValue={editing.name}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                              id="url"
                              name="url"
                              defaultValue={editing.url}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">
                              Cancel
                            </Button>
                          </DialogClose>
                          <DialogClose>
                            <Button type="submit">Save changes</Button>
                          </DialogClose>
                        </DialogFooter>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
