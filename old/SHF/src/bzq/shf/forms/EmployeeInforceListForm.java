/*
 * Created on 26/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;

import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.EmployeeBean;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EmployeeInforceListForm extends ShiftInforceRequestForm {
	protected EmployeeBean[] employee;
	protected AgentDayBean[] agentDayBeans;
	protected String sourceWindow = null;
	protected Date start_potential = null;
	protected Date end_potential = null;


	public AgentDayBean[] getAgentDayBeans() {
		return agentDayBeans;
	}

	public void setAgentDayBeans(AgentDayBean[] agentDayBeans) {
		this.agentDayBeans = agentDayBeans;
	}

	/**
	 * @return
	 */
	public EmployeeBean[] getEmployee() {
		return employee;
	}

	/**
	 * @param beans
	 */
	public void setEmployee(EmployeeBean[] beans) {
		employee = beans;
	}

	/**
	 * @return
	 */

	/**
	 * @return
	 */
	public String getSourceWindow() {
		return sourceWindow;
	}

	/**
	 * @param string
	 */
	public void setSourceWindow(String string) {
		sourceWindow = string;
	}

	public Date getStart_potential() {
		return start_potential;
	}

	public void setStart_potential(Date start_potential) {
		this.start_potential = start_potential;
	}

	public Date getEnd_potential() {
		return end_potential;
	}

	public void setEnd_potential(Date end_potential) {
		this.end_potential = end_potential;
	}

}
