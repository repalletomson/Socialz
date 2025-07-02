import { Client, Storage } from "appwrite";
// import { storage } from "./appwriteConfig";
import { ID } from "appwrite";
import mime from "mime";
// import { Client, Account, ID ,Storage} from 'react-native-appwrite';

// export const appwriteConfig = {
//   endpoint: "https://cloud.appwrite.io/v1", // Replace with your Appwrite endpoint
//   projectId: "678bab850014de406fcc", // Replace with your Appwrite Project ID
//   storageId: "678bac4b0005153d3c56", // Replace with your Appwrite Storage Bucket ID
// };                 
export const appwriteConfig = {
    endpoint: "https://cloud.appwrite.io/v1",
    projectId: "6770ee2e0033d7bd84fd",
    storageId: "67757a71000ed770330f",
    chunkSize: 5 * 1024 * 1024, // 5MB chunks
  };
const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

// const client = new Client()
//     .setProject('678bab850014de406fcc')
//     .setPlatform('com.vip.app');

export const storage = new Storage(client);



// Upload File (Image or Video)
export async function uploadFile(fileUri, type) {
    if (!fileUri) {
      console.error("Upload Error: File URI is undefined");
      return;
    }
  
    try {
      // Extract filename and MIME type
      console.log("upload started in appwrite")
      const fileName = fileUri.split("/").pop();
      const mimeType = mime.getType(fileName) || "application/octet-stream";
      console.log("upload mimeType succesful")
      console.log("Uploading file:", fileUri, "MIME Type:", mimeType);

      // Fetch file from URI and check response
    const response = await fetch(fileUri);

 if (!response.ok) {
   console.error("Fetch failed:", response.statusText);

  throw new Error("File fetch failed");
}      
  
      // Convert file to Blob
      const fileBlob = await response.blob();
      if (!fileBlob || fileBlob.size === 0) {
        
        console.error("Invalid file blob:", fileBlob);
        throw new Error("Invalid file blob");
    }
    console.log("upload file blob successful") 
    console.log("File Blob Size:", fileBlob.size);

      const uploadedFile = await storage.createFile(
        appwriteConfig.storageId,
        ID.unique(),
        fileBlob,
        { type: mimeType }
      );
      console.log("File uploaded successfully:", uploadedFile);

      return await getFilePreview(uploadedFile.$id, type);
    } catch (error) {
      console.error("Upload Error:", error.message);
      throw new Error("File upload failed.");
    }
  }
// Get File Preview URL
export async function getFilePreview(fileId, type) {
  try {
    if (type === "video") {
      return storage.getFileView(appwriteConfig.storageId, fileId);
    } else if (type === "image") {
     console.log("fileId",fileId)
      return storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );

    } else {
      throw new Error("Invalid file type");
    }
  } catch (error) {
    console.error("File Retrieval Error:", error);
    throw new Error("Failed to retrieve file.");
  }
}
