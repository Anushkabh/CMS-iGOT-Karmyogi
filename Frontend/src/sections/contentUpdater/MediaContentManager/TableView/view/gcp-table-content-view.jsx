import axios from "axios";
import { useState, useEffect, useCallback } from "react";

import { Grid } from "@mui/material";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import TableBody from "@mui/material/TableBody";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";

import UserTableRow from "../website-table-row";
import UserTableHead from "../website-table-head";
import UserTableToolbar from "../website-table-toolbar";
import AppWidgetSummary from "../app-widget-summary";
import { applyFilter, getComparator } from "../utils";
import AddFileDialog from "../../AddFileSection";

// ----------------------------------------------------------------------

export default function UserPage({
  selectedPageId,
  folderContent,
  fetchContent,
  setShowAddNewFileDialog,
  showAddNewFileDialog,
  selectedWebsiteBucket,
  handleCreateNewFile,
  setSuccessMessage
}) {
  const [page, setPage] = useState(0);
  const [users, setusers] = useState(folderContent.files);
  const [order, setOrder] = useState("asc");
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState("name");
  const [filterName, setFilterName] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === "asc";
    if (id !== "") {
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(id);
    }
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = users.map((n) => n.name);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setusers(folderContent.files);
      console.log(folderContent.files);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [folderContent]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const dataFiltered = applyFilter({
    inputData: users,
    comparator: getComparator(order, orderBy),
    filterName,
  });

  return (
    <Container>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        m={6}
      >
        <Typography variant="h4">{selectedPageId} Folder's File</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowAddNewFileDialog(true)}
        >
          Add Files
        </Button>
      </Stack>

   { showAddNewFileDialog && 
    

      <AddFileDialog
      fetchContent={fetchContent}
      setSuccessMessage={setSuccessMessage}
      selectedPageId={selectedPageId}
        selectedWebsiteBucket={selectedWebsiteBucket}
        // open={showAddNewFileDialog}
        // onClose={() => setShowAddNewFileDialog(false)}
        handleCreateNewFile={handleCreateNewFile}
      />}

      <>
        <Card
          sx={{
            py: 5,
            borderRadius: "3rem",
            boxShadow: "2px 4px 10px rgba(0.1, 0.1, 0.1, 0.1)",
          }}
        >
          {/* search bar */}
          <UserTableToolbar
            numSelected={selected.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
          />

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={5}
            m={4}
            gap={3}
          >
            <h4>Showing All Websites</h4>
          </Stack>

          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={order}
                orderBy={orderBy}
                rowCount={users.length}
                numSelected={selected.length}
                onRequestSort={handleSort}
                onSelectAllClick={handleSelectAllClick}
                headLabel={[
                  { id: "name", label: "Name", align: "center" },
                  { id: "url", label: "URL" },
                  { id: "Size", label: "bucketName" },
                  { id: "updatedAt", label: "Updated Date" },
                  { id: "" },
                ]}
              />

              <TableBody>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <UserTableRow
                          selectedPageId={selectedPageId}
        selectedWebsiteBucket={selectedWebsiteBucket}
        setSuccessMessage={setSuccessMessage}
        fetchContent={fetchContent}
                      key={row._id}
                      id={row._id}
                      user={row}
                      fetchUsers={fetchUsers}
                      selected={selected.indexOf(row._id) !== -1}
                      handleClick={(event) => handleClick(event, row._id)}
                    />
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            page={page}
            component="div"
            count={users.length}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </>
    </Container>
  );
}
