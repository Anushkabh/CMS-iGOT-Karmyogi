import React, { useState } from "react";
import {
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { CloudUpload, Delete, CheckCircle } from "@mui/icons-material";
import axios from "axios";

function AddFileSection({setSuccessMessage,fetchContent, selectedWebsiteBucket, selectedPageId }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleFileRemove = (file) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((f) => f !== file));
    setUploadStatus((prevStatus) => {
      const newStatus = { ...prevStatus };
      delete newStatus[file.name];
      return newStatus;
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async () => {
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      setUploadStatus((prevStatus) => ({
        ...prevStatus,
        [file.name]: "uploading",
      }));

      try {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/web_media_gcp/media/upload/${selectedWebsiteBucket}/${selectedPageId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setUploadStatus((prevStatus) => ({
          ...prevStatus,
          [file.name]: "success",
        }));
        

        setSuccessMessage(`File ${file.name} uploaded successfully!`);
      } catch (error) {
        console.error("Error uploading file:", error.response?.data || error.message);
        setUploadStatus((prevStatus) => ({
          ...prevStatus,
          [file.name]: "error",
        }));
      }
    }
    fetchContent(selectedPageId);
  };

  return (
    <Card
      sx={{
        py: 5,
        px: 3,
        borderRadius: "3rem",
        my: 4,
        boxShadow: "2px 4px 10px rgba(0.1, 0.1, 0.1, 0.1)",
      }}
    >
      <CardContent>
        <Typography p={3} variant="h6" gutterBottom>
          Upload Media
        </Typography>
        <Grid
          container
          spacing={2}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          sx={{
            border: "2px dashed #ccc",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          <Grid item xs={12}>
            <Typography variant="body2">
              Drag & Drop files here or click to browse
            </Typography>
            <input
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
              >
                Browse Files
              </Button>
            </label>
          </Grid>
        </Grid>
        <List>
          {selectedFiles.map((file, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={file.name}
                secondary={`${(file.size / (1024 * 1024)).toFixed(2)} MB`}
              />
              <IconButton edge="end" onClick={() => handleFileRemove(file)}>
                {uploadStatus[file.name] === "uploading" ? (
                  <CircularProgress size={24} />
                ) : uploadStatus[file.name] === "success" ? (
                  <CheckCircle color="success" />
                ) : (
                  <Delete />
                )}
              </IconButton>
            </ListItem>
          ))}
        </List>
      </CardContent>
      <CardActions>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={selectedFiles.length === 0}
        >
          Submit
        </Button>
      </CardActions>
    </Card>
  );
}

export default AddFileSection;
