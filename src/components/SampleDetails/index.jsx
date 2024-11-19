import React, { useContext, useState } from "react";
import { LabContext, LabDispatchContext } from "../../context/LabContext";
import Inputfield from "../Inputfield";

import styles from "./Sample.module.css";

export default function PatientDetails({ ...restProps }) {
  const { sampleDetails } = useContext(LabContext);
  const dispatch = useContext(LabDispatchContext);
  const [isValid, setIsValid] = useState({
    name: {
      status: null,
      message: "",
    },
    sexAndAge: {
      status: null,
      message: "",
    },
    dateOfTest: {
      status: null,
      message: "",
    },
    reference: {
      status: null,
      message: "",
    },
  });

  const errorMessages = {
    name: "Supplied by M/s cannot be empty!",
    sexAndAge: "Sex And Age cannot be empty!",
    dateOfTest: "All date field should be filled",
    reference: "reference cannot be empty!",
  };

  const checkValidity = (e) => {
    if (e.target.value.length === 0) {
      setIsValid({
        ...isValid,
        [e.target.id]: {
          status: true,
          message: errorMessages[e.target.id],
        },
      });
    } else {
      setIsValid({ ...isValid, [e.target.id]: { status: false } });
    }
  };

  const onInputChange = (e) => {
    checkValidity(e);
    dispatch({
      type: "updatePatientDetails",
      payload: { ...sampleDetails, [e.target.id]: e.target.value },
    });
  };

  const onSexAndInputChange = (e) => {
    const currentInputValue = sampleDetails.sexAndAge;
    const currentInputValueLength = sampleDetails.sexAndAge.length;
    let value = e.target.value;
    checkValidity(e);
    if (currentInputValueLength === 0) {
      value = `${e.target.value.toUpperCase()} / `;
    } else if (e.target.value.length === 2) {
      value = `${currentInputValue} / ${e.target.value.slice(1)}`;
    } else if (e.target.value.length > 2 && e.target.value.length <= 4) {
      value = currentInputValue[0];
    }
    dispatch({
      type: "updatePatientDetails",
      payload: { ...sampleDetails, [e.target.id]: value },
    });
  };

  return (
    <section className={styles.container} {...restProps}>
      <h2 className="text--md">Sample Details</h2>
      <form className={styles["form-container"]}>
        <Inputfield
          name="first-name"
          label="Supplied by M/s"
          value={sampleDetails.name}
          placeholder="Enter Supplied by M/s"
          id="name"
          error={isValid.name.status}
          errorMessage={isValid.name.message}
          onChange={onInputChange}
        />
        <Inputfield
          name="sex-age"
          label="Sex/Age"
          value={sampleDetails.sexAndAge}
          placeholder="Enter M or F / Age"
          id="sexAndAge"
          error={isValid.sexAndAge.status}
          errorMessage={isValid.sexAndAge.message}
          onChange={onSexAndInputChange}
        />
        <Inputfield
          type="date"
          name="date-of-test"
          label="Date Of Test"
          value={sampleDetails.dateOfTest}
          id="dateOfTest"
          error={isValid.dateOfTest.status}
          errorMessage={isValid.dateOfTest.message}
          onChange={onInputChange}
        />
        <Inputfield
          name="Nature of Sample"
          label="Nature of Sample"
          value={sampleDetails.reference}
          placeholder="Enter Nature of Sample"
          id="reference"
          error={isValid.reference.status}
          errorMessage={isValid.reference.message}
          onChange={onInputChange}
        />
      </form>
    </section>
  );
}
