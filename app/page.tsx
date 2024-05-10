"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import TableComponent from "../components/TableComponent";

interface FormFields {
  ecosystem: string;
  playbackId: string;
  prefix: string;
  jwt: string;
}

const regionalNodes: {
  [ecosystem: string]: IRegionNode[];
} = {
  prod: [
    { region: "sao", count: 1 },
    { region: "sto", count: 5 },
    { region: "sin", count: 4 },
    { region: "nyc", count: 2 },
    { region: "lax", count: 1 },
    { region: "prg", count: 1 },
    { region: "hnd", count: 1 },
    { region: "lon", count: 6 },
    { region: "mdw", count: 2 },
    { region: "fra", count: 7 },
    { region: "sea", count: 1 },
    { region: "mia", count: 1 },
    { region: "syd", count: 1 },
    { region: "mos2", count: 1 },
  ],
  staging: [
    { region: "fra-staging", count: 1 },
    { region: "sin-staging", count: 1 },
    { region: "mdw-staging", count: 1 },
  ],
};

function getUrl(
  region: string,
  ecosystem: string,
  index: number,
  playbackId: string,
  prefix: string
): string {
  const host = ecosystem === "prod" ? "lp-playback.studio" : "livepeer.monster";
  return `https://${region}-${ecosystem}-catalyst-${index}.${host}/hls/${prefix}+${playbackId}/index.m3u8`;
}

async function getTimings(url: string, jwt: string): Promise<ITimingResult> {
  const jwtHeader = { "Livepeer-Jwt": jwt };
  try {
    const start = Date.now();
    console.log(`fetching ${url} at ${start}`);
    const response = await fetch(url, { headers: jwtHeader });
    const end = Date.now();
    const body = await response.text();
    return {
      url,
      start,
      end,
      time: (end - start) / 1000,
      success:
        response.ok &&
        !(body.includes("failed") || response.headers.has("error")),
      status: response.status,
    };
  } catch (error) {
    console.log(error);
    return {
      url,
      start: 0,
      end: 0,
      time: 0,
      success: false,
      status: 500,
    };
  }
}

function loopRegions({ ecosystem, playbackId, prefix, jwt }: FormFields) {
  const regions = regionalNodes[ecosystem as string];
  let promises = [];
  for (const { region, count } of regions) {
    for (let index = 0; index < count; index++) {
      let url = getUrl(region, ecosystem, index, playbackId, prefix);
      promises.push(getTimings(url, jwt));
    }
  }
  return Promise.all(promises);
}

export default function Home() {
  const [data, setData] = useState<ITimingResult[]>([]);
  const idRef = useRef<HTMLInputElement>(null),
    prefixRef = useRef<HTMLSelectElement>(null),
    ecosystemRef = useRef<HTMLSelectElement>(null),
    jwtRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const id = idRef.current?.value || "",
      prefix = prefixRef.current?.value || "",
      ecosystem = ecosystemRef.current?.value || "",
      jwt = jwtRef.current?.value || "";
    console.log(id, prefix, ecosystem);

    if ([ecosystem, prefix, id].indexOf("") !== -1) {
      setData([]);
      return;
    }

    let results = await loopRegions({
      playbackId: id,
      ecosystem,
      prefix,
      jwt,
    });
    setData(results);
    console.log("got results");
  };

  useEffect(() => {
    console.log(`${new Date()} called effect`);
    // console.dir(data);
  }, [data]);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>required fields</legend>
          <label htmlFor="id">Video playback ID</label>
          <input type="text" id="id" name="id" ref={idRef} />

          <label htmlFor="prefix">Prefix</label>
          <select
            id="prefix"
            name="prefix"
            defaultValue="video"
            ref={prefixRef}
          >
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
        </fieldset>

        <fieldset>
          <legend>optional fields</legend>
          <label htmlFor="jwt">Admin JWT (for private streams)</label>
          <input id="jwt" name="jwt" defaultValue="" ref={jwtRef} />
        </fieldset>

        <button type="submit">Check</button>
      </form>

      <TableComponent data={data} />
    </>
  );
}
