import React, { useState, useEffect } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Snackbar,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import PageSelect from "./PageSelect";
import Dialogs from "./Dialogs";
import { diffChars } from "diff";
import delete_icon from "/icons/delete.png";
import AddNewPage from "./AddNewPage";
import DeletePage from "./DeletePage";

function TextManagerView({selectedWebsiteBucket}) {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [content, setContent] = useState({});
  const [originalContent, setOriginalContent] = useState({});
  const [selectedPageId, setSelectedPageId] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [pages, setPages] = useState([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [showAddPageDialog, setShowAddPageDialog] = useState(false);
  const [showDeletePageDialog, setShowDeletePageDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/web_gcp/folders/${selectedWebsiteBucket}`);
      setPages(response.data);
      setSelectedPageId(response.data[0] || "");
    } catch (error) {
      console.error("Error fetching pages:", error);
      setError("Failed to fetch pages. Please try again.");
    }
  };

  const fetchContent = async (pageId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/web_gcp/content/${selectedWebsiteBucket}/${pageId}`
      );
      const contentData = response.data;
      setContent(contentData);
      setOriginalContent(contentData);

      const firstField = Object.keys(contentData)[0];
      const availableLanguages = Object.keys(contentData[firstField]);
      setLanguages(availableLanguages);
      setSelectedLanguage(availableLanguages[0]);
    } catch (error) {
      console.error("Error fetching content:", error);
      setError("Failed to fetch content. Please try again.");
    }
    setLoading(false);
  };

  const handleLanguageChange = (event) => {
    const lang = event.target.value;
    setSelectedLanguage(lang);
  };

  const handleFieldChange = (fieldName, value) => {
    setContent({
      ...content,
      [fieldName]: {
        ...content[fieldName],
        [selectedLanguage]: value,
      },
    });
  };

  const handleCreateNewPage = async (pageId, initialContent) => {
    setLoading(true);
    try {
      const initialContentObject = JSON.parse(initialContent);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/web_gcp/folders/${selectedWebsiteBucket}`, {
        pageId,
        initialContent: initialContentObject,
      });
      setSuccessMessage("New page created successfully!");
      fetchPages(); // Refresh the list of pages
    } catch (error) {
      console.error("Error creating new page:", error);
      setError("Failed to create new page. Please try again.");
    }
    setLoading(false);
  };

  const handleDeletePage = async (pageId) => {
    setLoading(true);
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/web_gcp/content/${selectedWebsiteBucket}/${pageId}`);
      setSuccessMessage("Page deleted successfully!");
      fetchPages(); // Refresh the list of pages
      if (pageId === selectedPageId) {
        setSelectedPageId(pages[0] || "");
      }
    } catch (error) {
      console.error("Error deleting page:", error);
      setError("Failed to delete page. Please try again.");
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/web_gcp/content/${selectedWebsiteBucket}/${selectedPageId}`,
        content
      );
      setSuccessMessage("Content updated successfully!");
      setOriginalContent(content);
      resetForm();
    } catch (error) {
      console.error("Error updating content:", error);
      setError("Failed to update content. Please try again.");
    }
    setLoading(false);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage("");
  };

  const handleShowJson = () => {
    setShowJsonDialog(true);
  };

  const handleCloseJsonDialog = () => {
    setShowJsonDialog(false);
  };

  const handleShowComparison = () => {
    setShowComparisonDialog(true);
  };

  const handleCloseComparisonDialog = () => {
    setShowComparisonDialog(false);
  };

  const handlePageChange = (event) => {
    const pageId = event.target.value;
    setSelectedPageId(pageId);
    setContent({});
    setOriginalContent({});
    setLanguages([]);
    setSelectedLanguage("");
  };

  const handleNewFieldChange = (event) => {
    setNewFieldName(event.target.value);
  };

  const handleAddNewField = () => {
    if (newFieldName.trim() === "") return;

    const updatedContent = {
      ...content,
      [newFieldName]: languages.reduce((acc, lang) => {
        acc[lang] = "insert_value";
        return acc;
      }, {}),
    };

    setContent(updatedContent);
    setNewFieldName("");
  };

  const handleDeleteField = (fieldName) => {
    const updatedContent = { ...content };
    delete updatedContent[fieldName];
    setContent(updatedContent);
  };

  const getDifferences = (original, updated) => {
    const differences = {};
    for (const key in updated) {
      if (JSON.stringify(updated[key]) !== JSON.stringify(original[key])) {
        differences[key] = updated[key];
      }
    }
    return differences;
  };

  const differences = getDifferences(originalContent, content);

  const getHighlightedText = (original, updated) => {
    const diff = diffChars(original, updated);
    return diff.map((part, index) => {
      const style = part.added
        ? { backgroundColor: "lightgreen" }
        : part.removed
        ? { backgroundColor: "lightcoral" }
        : {};
      return (
        <span key={index} style={style}>
          {part.value}
        </span>
      );
    });
  };

  const resetForm = () => {
    setContent({});
    setOriginalContent({});
    setSelectedLanguage(languages[0] || "");
  };

  return (
    <div>
      <Snackbar
        open={!!error || !!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={error || successMessage}
      />
      <Paper sx={{ p: 4, my: 5, borderRadius: 8 }}>
        <Box p={3}>
          <Grid container spacing={3}>
            <Paper
              sx={{
                p: 4,
                my: 5,
                borderRadius: 8,
                width: "100%",
                backgroundColor: "#fffbef",
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      Select page
                    </Typography>
                  </Box>

                  <PageSelect
                    pages={pages}
                    selectedPageId={selectedPageId}
                    handlePageChange={handlePageChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid
                      container
                      justifyContent="space-between"
                      alignItems="center"
                      px={2}
                    >
                      {" "}
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => fetchContent(selectedPageId)}
                        disabled={!selectedPageId || loading}
                      >
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Fetch Content"
                        )}
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowAddPageDialog(true)}
                      >
                        Add Page
                      </Button>
                      <Button
                        onClick={() => setShowDeletePageDialog(true)}
                        variant="contained"
                        color="secondary"
                        sx={{ mt: 2, ml: 2 }}
                      >
                        Delete Page
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="language-select-label">
                  Select Language
                </InputLabel>
                <Select
                  label="Select Language"
                  labelId="language-select-label"
                  id="language-select"
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {Object.keys(content).map((field) => (
              <Grid item xs={12} key={field}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={3}>
                    <TextField value={field} disabled></TextField>
                  </Grid>
                  <Grid item xs={7}>
                    <TextField
                      label={`Enter ${field} in ${selectedLanguage}`}
                      value={content[field][selectedLanguage] || ""}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton
                      onClick={() => handleDeleteField(field)}
                      color="secondary"
                    >
                      <img width={25} src={delete_icon} />
                    </IconButton>
                  </Grid>
                </Grid>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Grid
                container
                justifyContent="space-between"
                alignItems="center"
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleShowJson}
                >
                  Show JSON
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleShowComparison}
                >
                  Show Changes
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  color="success"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Submit"}
                </Button>
              </Grid>
            </Grid>

            {Object.keys(content).length > 0 && (
              <Grid item xs={12}>
                <TextField
                  label="New Field Name"
                  value={newFieldName}
                  onChange={handleNewFieldChange}
                  variant="outlined"
                  helperText={
                    newFieldName.trim() === ""
                      ? "Field name cannot be empty"
                      : ""
                  }
                  fullWidth
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddNewField}
                  disabled={!newFieldName.trim()}
                  sx={{ mt: 2 }}
                >
                  Add New Field
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>
      <AddNewPage
        handleCreateNewPage={handleCreateNewPage}
        open={showAddPageDialog}
        onClose={() => setShowAddPageDialog(false)}
      />
      <DeletePage
        open={showDeletePageDialog}
        onClose={() => setShowDeletePageDialog(false)}
        handleDeletePage={handleDeletePage}
        pages={pages}
        fetchedSelectedPageId={selectedPageId}
      />

      <Dialogs
        showJsonDialog={showJsonDialog}
        handleCloseJsonDialog={handleCloseJsonDialog}
        content={content}
        showComparisonDialog={showComparisonDialog}
        handleCloseComparisonDialog={handleCloseComparisonDialog}
        originalContent={originalContent}
        differences={differences}
        getHighlightedText={getHighlightedText}
      />
    </div>
  );
}

export default TextManagerView;
