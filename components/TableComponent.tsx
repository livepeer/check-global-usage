export default function TableComponent({ data }: { data: ITimingResult[] }) {
  let rows = [];
  for (let i = 0; i < data.length; i++) {
    console.log(`at index=${i}`, data[i]);
    rows.push(
      <tr>
        <td>{data[i].url}</td>
        <td className={(data[i].success && "text-green-500") || "text-red-500"}>
          {(data[i].success && "Success") || "Fail"}
        </td>
        <td>{data[i].time}</td>
        <td>{data[i].status}</td>
        <td></td>
      </tr>
    );
  }

  console.log(`rendering component with ${data.length} data=`, data);

  return (
    <table className="table-auto">
      <thead>
        <tr>
          <th>URL</th>
          <th>Success</th>
          <th>Time (in sec.)</th>
          <th>HTTP status</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}
