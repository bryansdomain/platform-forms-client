import axios, { AxiosError } from "axios";
export const usePublish = (publishingStatus: boolean) => {
  const uploadJson = async (jsonConfig: string, formID?: string) => {
    let formData;
    try {
      formData = JSON.parse(jsonConfig);
    } catch (e) {
      if (e instanceof SyntaxError) {
        return { error: new Error("failed to parse form data") };
      }
    }

    formData.publishingStatus = publishingStatus;

    try {
      const result = await axios({
        url: "/api/templates",
        method: formID ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          formConfig: formData,
          formID: formID,
        },
        timeout: process.env.NODE_ENV === "production" ? 60000 : 0,
      });
      return { id: result?.data?.id };
    } catch (err) {
      return { error: err as AxiosError };
    }
  };

  return { uploadJson };
};
