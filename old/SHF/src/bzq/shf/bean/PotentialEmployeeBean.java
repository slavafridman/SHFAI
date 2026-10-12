package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

public class PotentialEmployeeBean extends ShfBaseBean {
	
	
	EmployeeBean employeeBean;
	protected Date start_Potential;
	protected Date end_Potential;
	protected String checked;
	

	public String getChecked() {
		return checked;
	}
	public void setChecked(String checked) {
		this.checked = checked;
	}
	public EmployeeBean getEmployeeBean() {
		return employeeBean;
	}
	public void setEmployeeBean(EmployeeBean employeeBean) {
		this.employeeBean = employeeBean;
	}
	public Date getStart_Potential() {
		return start_Potential;
	}
	public void setStart_Potential(Date start_Potential) {
		this.start_Potential = start_Potential;
	}
	public Date getEnd_Potential() {
		return end_Potential;
	}
	public void setEnd_Potential(Date end_Potential) {
		this.end_Potential = end_Potential;
	}
	@Override
	public HashMap getFieldsMapping() {
		// TODO Auto-generated method stub
		return null;
	}
	


	
}
