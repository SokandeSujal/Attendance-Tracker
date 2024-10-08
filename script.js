document.addEventListener("DOMContentLoaded", () => {
    const { jsPDF } = window.jspdf;

    document
      .getElementById("calculateButton")
      .addEventListener("click", calculateAttendance);
    document
      .getElementById("exportButton")
      .addEventListener("click", exportToPDF);
    document
      .getElementById("darkModeToggle")
      .addEventListener("click", toggleDarkMode);

    let attendanceChart;

    function calculateAttendance() {
      const input = document.getElementById("attendanceInput").value.trim();
      const lines = input.split("\n").filter((line) => line.trim() !== "");

      let totalAttended = 0;
      let totalClasses = 0;
      let overallEligible = true;
      const subjectDetails = [];

      for (let i = 0; i < lines.length; i += 2) {
        if (i + 1 < lines.length) {
          const subject = lines[i].trim();
          const attendance = lines[i + 1].trim();

          if (attendance) {
            const [attended, total] = attendance.split("/").map(Number);
            if (total > 0) {
              totalAttended += attended;
              totalClasses += total;

              const percentage = (attended / total) * 100;
              const eligibleForExam = percentage >= 80;

              let additionalLecturesRequired = 0;
              if (!eligibleForExam) {
                additionalLecturesRequired = Math.ceil(
                  (0.8 * total - attended) / (1 - 0.8)
                );
              }

              const missableClasses = Math.floor(attended - 0.8 * total);

              subjectDetails.push({
                subject,
                attended,
                total,
                percentage,
                eligibleForExam,
                additionalLecturesRequired,
                missableClasses,
              });

              if (!eligibleForExam) overallEligible = false;
            }
          }
        }
      }

      const overallPercentage =
        totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
      const overallEligibilityClass = overallEligible
        ? "eligible"
        : "not-eligible";
      const overallEligibilityMessage = overallEligible
        ? "You are eligible for all exams."
        : "You are not eligible for some exams.";

      document.getElementById("overallResults").innerHTML = `
        <h2>Overall Results</h2>
        <p>Total Attendance: ${totalAttended}/${totalClasses}</p>
        <p>Overall Percentage: ${overallPercentage.toFixed(2)}%</p>
        <p class="${overallEligibilityClass}">${overallEligibilityMessage}</p>
      `;

      document.getElementById("subjectResults").innerHTML = `
        <h3>Subject Wise Results:</h3>
        <ul>
          ${subjectDetails
            .map(
              (detail) => `
                <li class="${
                  detail.eligibleForExam ? "eligible" : "not-eligible"
                }">
                  <strong>${detail.subject}</strong>: ${
                detail.attended
              }/${detail.total} (${detail.percentage.toFixed(2)}%) -
                  ${
                    detail.eligibleForExam
                      ? `Eligible. You can miss ${detail.missableClasses} more lectures.`
                      : `Not Eligible. You need to attend ${detail.additionalLecturesRequired} more lectures.`
                  }
                </li>
              `
            )
            .join("")}
        </ul>
      `;

      document.getElementById("overallResults").classList.add("show");
      document.getElementById("subjectResults").classList.add("show");

      updateChart(subjectDetails);
    }

    function updateChart(subjectDetails) {
      const ctx = document.getElementById("attendanceChart").getContext("2d");
      const labels = subjectDetails.map((detail) => detail.subject);
      const percentages = subjectDetails.map((detail) =>
        detail.percentage.toFixed(2)
      );
      const colors = subjectDetails.map((detail) =>
        detail.eligibleForExam
          ? "rgba(40, 167, 69, 0.6)"
          : "rgba(220, 53, 69, 0.6)"
      );

      if (attendanceChart) {
        attendanceChart.destroy();
      }

      attendanceChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Attendance Percentage",
              data: percentages,
              backgroundColor: colors,
              borderColor: colors,
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function (value) {
                  return value + "%";
                },
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.parsed.y}%`;
                },
              },
            },
          },
        },
      });
    }

    function exportToPDF() {
        const doc = new jsPDF();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Attendance Tracker Report", 105, 15, null, null, "center");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Overall Results", 10, 30);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);

        const overallResults = document.getElementById("overallResults");
        overallResults.querySelectorAll("p").forEach((p, index) => {
            doc.text(p.textContent, 10, 40 + index * 8);
        });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Subject Wise Results", 10, 70);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);

        const subjectResults = document.getElementById("subjectResults");
        let yOffset = 80;
        subjectResults.querySelectorAll("li").forEach((li) => {
            const lines = doc.splitTextToSize(li.textContent, 180);
            lines.forEach((line) => {
                doc.text(line, 10, yOffset);
                yOffset += 6;
            });
            yOffset += 4;
            if (yOffset > 270) {
                doc.addPage();
                yOffset = 20;
            }
        });

        doc.save("attendance_report.pdf");
    }

    function toggleDarkMode() {
      document.body.classList.toggle("dark-mode");
    }
});
