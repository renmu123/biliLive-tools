export const deepRaw = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};
