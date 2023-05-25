"use client";

// import dynamic from "next/dynamic";
import { FormEvent, useEffect, useState, useRef } from "react";
import TableComponent from "../components/TableComponent";

const regionalNodes: {
  [ecosystem: string]: IRegionNode[];
} = {
  prod: [
    { region: "sao", count: 3 },
    { region: "sin", count: 4 },
    { region: "nyc", count: 6 },
    { region: "lax", count: 3 },
    { region: "prg", count: 3 },
    { region: "lon", count: 3 },
    { region: "mdw", count: 3 },
    { region: "fra", count: 5 },
  ],
  staging: [
    { region: "sao", count: 1 },
    { region: "fra", count: 1 },
    { region: "sin", count: 1 },
    { region: "mdw", count: 1 },
  ],
};

// const TableComponent = dynamic(() => import("../components/TableComponent"), {
//   ssr: false,
// });

function getUrl(
  region: string,
  ecosystem: string,
  index: number,
  playbackId: string,
  prefix: string
): string {
  const tld = ecosystem === "prod" ? "studio" : "monster";
  return `https://${region}-${ecosystem}-catalyst-${index}.lp-playback.${tld}/hls/${prefix}+${playbackId}/index.m3u8`;
}

async function getTimings(url: string): Promise<ITimingResult> {
  const start = Date.now();
  console.log(`fetching ${url} at ${start}`);
  const response = await fetch(url);
  const end = Date.now();
  const body = await response.text();
  return {
    url,
    start,
    end,
    time: (end - start) / 1000,
    success: response.ok && !body.includes("failed"),
    status: response.status,
  };
}

function loopRegions(ecosystem: string, playbackId: string, prefix: string) {
  const regions = regionalNodes[ecosystem as string];
  let promises = [];
  for (const { region, count } of regions) {
    for (let index = 0; index < count; index++) {
      let url = getUrl(region, ecosystem, index, playbackId, prefix);
      promises.push(getTimings(url));
    }
  }
  return Promise.all(promises);
}

export default function Home() {
  const [data, setData] = useState<ITimingResult[]>([]);
  const idRef = useRef<HTMLInputElement>(null),
    prefixRef = useRef<HTMLSelectElement>(null),
    ecosystemRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const id = idRef.current?.value,
      prefix = prefixRef.current?.value,
      ecosystem = ecosystemRef.current?.value;
    console.log(id, prefix, ecosystem);
    if ([ecosystem, prefix, id].indexOf(undefined) !== -1) {
      setData([]);
      return;
    }
    let results = await loopRegions(
      ecosystem as string,
      id as string,
      prefix as string
    );
    setData(results);
    console.log("got results");
  };

  useEffect(() => {
    console.log(`${new Date()} called effect`);
    console.dir(data);
  }, [data]);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label htmlFor="id">Video playback ID</label>
        <input type="text" id="id" name="id" ref={idRef} />

        <label htmlFor="prefix">Prefix</label>
        <select id="prefix" name="prefix" defaultValue="video" ref={prefixRef}>
          <option value="video">video</option>
          <option value="videorec">videorec</option>
        </select>

        <label htmlFor="ecosystem">Environment/Ecosystem</label>
        <select
          id="ecosystem"
          name="ecosystem"
          defaultValue="prod"
          ref={ecosystemRef}
        >
          <option value="prod">prod</option>
          <option value="staging">staging</option>
        </select>

        <button type="submit">Check</button>
      </form>

      <TableComponent data={data} />
    </>
  );
}
