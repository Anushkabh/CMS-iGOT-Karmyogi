import { useState, useEffect, useCallback } from "react";

import api from "../../../utils/api";

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

import NewUserForm from "./new-user-form";
import UserTableRow from "../user-table-row";
import UserTableHead from "../user-table-head";
import UserTableToolbar from "../user-table-toolbar";
import AppWidgetSummary from "../app-widget-summary";
import { applyFilter, getComparator } from "../utils";

// ----------------------------------------------------------------------

export default function UserPage() {
  const [page, setPage] = useState(0);
  const [clickedTitle, setClickedTitle] = useState("all");
  const [users, setusers] = useState([]);
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

  const handleCardClick = (title) => {
    setClickedTitle(title);
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
      const response = await api.get("/user/users");
      setusers(response.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [clickedTitle]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, clickedTitle]);

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
        <Typography variant="h4">Users</Typography>
      </Stack>

      <Grid container spacing={3} m={5} gap={4}>
        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="All users"
            color="success"
            sx={{
              cursor: "pointer",
              "&:hover": {
                cursor: "pointer",
              },
            }}
            onClick={() => handleCardClick("all")}
            icon={<img alt="icon" src="/icons/glass/ic_glass_users.png" />}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="New Member"
            color="info"
            sx={{
              cursor: "pointer",
              "&:hover": {
                cursor: "pointer",
              },
            }}
            onClick={() => handleCardClick("New Member")}
            icon={
              <img
                style={{ width: "4rem" }}
                alt="icon"
                src="/icons/glass/ic_user_add.png"
              />
            }
          />
        </Grid>
      </Grid>

      {clickedTitle === "all" && (
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

            {clickedTitle === "all" && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={5}
                m={4}
                gap={3}
              >
                <h4>Showing All Members</h4>
              </Stack>
            )}
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
                    { id: "email", label: "Email" },
                    { id: "phone", label: "Phone" },
                    { id: "role", label: "role" },
                    { id: "createdAt", label: "Created Date" },
                    { id: "updatedAt", label: "Updated Date" },
                    { id: "status", label: "Status" },
                    { id: "" },
                  ]}
                />

                <TableBody>
                  {dataFiltered
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <UserTableRow
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
      )}

      <Card>
        {clickedTitle === "New Member" && (
          <NewUserForm setClickedTitle={setClickedTitle} />
        )}
      </Card>
    </Container>
  );
}
