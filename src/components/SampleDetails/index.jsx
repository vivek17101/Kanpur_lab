import React, { useContext, useState } from "react";
import { LabContext, LabDispatchContext } from "../../context/LabContext";
import Inputfield from "../Inputfield";

import styles from "./Sample.module.css";

export default function SampleDetails({ ...restProps }) {
  const { sampleDetails } = useContext(LabContext);
  const dispatch = useContext(LabDispatchContext);
  const [isValid, setIsValid] = useState({
    name: {
      status: null,
      message: "",
    },
    CO: {
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
    CO: "C/o cannot be empty!",
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
      type: "updateSampleDetails",
      payload: { ...sampleDetails, [e.target.id]: e.target.value },
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
          name="C/o:"
          label="C/o:"
          value={sampleDetails.CO}
          placeholder="Enter C/o:"
          id="CO"
          error={isValid.CO.status}
          errorMessage={isValid.CO.message}
          onChange={onInputChange}
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
