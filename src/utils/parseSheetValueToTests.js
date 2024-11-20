const values = [
  ["1", "F.F.A (Oleic Acid%)"],
  ["2", "Moisture (Including Volta tiles)", "minutes", "2  –  6 minutes"],
  ["3", "Sediment", "minutes", "4 – 10 minutes"],
  ["4", "Crude Fibre", "mgs / dl", "80 – 140 mgs / dl"],
  ["5", "Crude Protein", "mgs / dl", "80 – 140 mgs / dl"],
  ["6", "Total Ash/Ah Insol in HCL(S/S)", "mgs / dl", "70 – 110 mgs / dl"],
  ["7", "T.F.M/M.O.T Flash Point", "mgs / dl", "100 – 140 mgs / dl"],
  ["8", "Iodine Value/C.O.T", "mgs / dl", "15  –  40 mgs / dl"],
  ["9", "Melting Point/Helphen Test", "mgs / dl", "0.4 – 1.3 mgs / dl"],
];

const parseToArray = () => {
  let data = [];
  values.map((value, index) => {
    let test = {
      id: index + 1,
      name: value[1] ?? "",
      testType: value[4] ? [value[4]] : [],
      unit: value[2] ?? "",
      referenceValue: value[3] ?? "",
    };
    data.push(test);
  });

  console.log(data);
};
