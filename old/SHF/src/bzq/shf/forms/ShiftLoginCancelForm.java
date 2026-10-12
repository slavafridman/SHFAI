/*
 * Created on 25/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;
import java.util.Vector;

import bzq.shf.bean.ShiftLoginCancelBean;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftLoginCancelForm extends ShiftLoginCancelBean{
	
	public ShiftLoginCancelForm() {
		super();
	}
	
	private Date shiftStart;
	private Date shiftEnd;
	private String agantFirstName;
	private String agantLastName;
	private String agantOrgUnit;
	private String applierFirstName;
	private String applierLastName;
	private String updaterFirstName;
	private String updaterLastName;
	private Vector applierVec;
	private Vector updaterVec;
	private int missingReasonId;
	private int employeeId;
	private String shiftStartDate;
	private String shiftStartTime;
	private String shiftEndDate;
	private String shiftEndTime;
	
	
	public Date getShiftStart() {
		return shiftStart;
	}
	public void setShiftStart(Date shiftStart) {
		this.shiftStart = shiftStart;
	}
	public Date getShiftEnd() {
		return shiftEnd;
	}
	public void setShiftEnd(Date shiftEnd) {
		this.shiftEnd = shiftEnd;
	}
	public String getAgantFirstName() {
		return agantFirstName;
	}
	public void setAgantFirstName(String agantFirstName) {
		this.agantFirstName = agantFirstName;
	}
	public String getAgantLastName() {
		return agantLastName;
	}
	public void setAgantLastName(String agantLastName) {
		this.agantLastName = agantLastName;
	}
	public String getAgantOrgUnit() {
		return agantOrgUnit;
	}
	public void setAgantOrgUnit(String agantOrgUnit) {
		this.agantOrgUnit = agantOrgUnit;
	}
	public String getApplierFirstName() {
		return applierFirstName;
	}
	public void setApplierFirstName(String applierFirstName) {
		this.applierFirstName = applierFirstName;
	}
	public String getApplierLastName() {
		return applierLastName;
	}
	public void setApplierLastName(String applierLastName) {
		this.applierLastName = applierLastName;
	}
	public String getUpdaterFirstName() {
		return updaterFirstName;
	}
	public void setUpdaterFirstName(String updaterFirstName) {
		this.updaterFirstName = updaterFirstName;
	}
	public String getUpdaterLastName() {
		return updaterLastName;
	}
	public void setUpdaterLastName(String updaterLastName) {
		this.updaterLastName = updaterLastName;
	}
	public Vector getApplierVec() {
		return applierVec;
	}
	public void setApplierVec(Vector applierVec) {
		this.applierVec = applierVec;
	}
	public Vector getUpdaterVec() {
		return updaterVec;
	}
	public void setUpdaterVec(Vector updaterVec) {
		this.updaterVec = updaterVec;
	}
	public int getMissingReasonId() {
		return missingReasonId;
	}
	public void setMissingReasonId(int missingReasonId) {
		this.missingReasonId = missingReasonId;
	}
	public int getEmployeeId() {
		return employeeId;
	}
	public void setEmployeeId(int employeeId) {
		this.employeeId = employeeId;
	}
	public String getShiftStartDate() {
		return shiftStartDate;
	}
	public void setShiftStartDate(String shiftStartDate) {
		this.shiftStartDate = shiftStartDate;
	}
	public String getShiftStartTime() {
		return shiftStartTime;
	}
	public void setShiftStartTime(String shiftStartTime) {
		this.shiftStartTime = shiftStartTime;
	}
	public String getShiftEndDate() {
		return shiftEndDate;
	}
	public void setShiftEndDate(String shiftEndDate) {
		this.shiftEndDate = shiftEndDate;
	}
	public String getShiftEndTime() {
		return shiftEndTime;
	}
	public void setShiftEndTime(String shiftEndTime) {
		this.shiftEndTime = shiftEndTime;
	}
	
	
}
