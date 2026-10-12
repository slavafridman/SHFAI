/*
 * Created on 26/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;
import java.util.HashMap;
import java.util.Vector;

import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.PotentialEmployeeBean;
import bzq.shf.bean.ShfBaseBean;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class PotentialInforceForm extends ShfBaseBean {
	protected PotentialEmployeeBean[] potentialEmployeeBeans;
	protected Vector potentialInforceData = null;
	protected String sourceWindow = null;
	private Date StartPotential =  null;
	private Date EndPotential = null;
	private Date StartPotentialDT =  null;
	private Date EndPotentialDT = null;
	private Date startTimeInforce = null;
	private Date endTimeInforce = null;
	private Date startTimeInforceToCheck = null;
	private Date endTimeInforceToCheck = null;
	
	
	private int id;
	private Date date;
	//private int numOfAgents;
	private int skill;
	private String moked;
	private String activity;
	private String action;
	private AgentDayBean[] days;
	private String[] team;
	private String[] innerJob;
	private boolean trained;
	private boolean categoryJob;
	private boolean workFromHome;
	private String remark;
	private String[]activities ;
	private String firstName;
	private String lastName;
	private int moreDetails;
	private int breaksNumber;
	private int firstBreakLength;
	private int secondBreakLength;
	private int thirdBreakLength;
	private String firstBreakTime;
	private String secondBreakTime;
	private String thirdBreakTime;
	private HashMap fieldsMapping;
	private String[] selectedPotential;
	private int[] idNumber;
	private String[] empIdNumber;
	private Integer maxLength;
	
	
	
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}
	
	
	
	public int[] getIdNumber() {
		return idNumber;
	}



	public void setIdNumber(int[] idNumber) {
		this.idNumber = idNumber;
	}



	public String[] getEmpIdNumber() {
		return empIdNumber;
	}



	public void setEmpIdNumber(String[] empIdNumber) {
		this.empIdNumber = empIdNumber;
	}



	public Date getStartTimeInforce() {
		return startTimeInforce;
	}

	public void setStartTimeInforce(Date startTimeInforce) {
		this.startTimeInforce = startTimeInforce;
	}

	public Date getEndTimeInforce() {
		return endTimeInforce;
	}

	public void setEndTimeInforce(Date endTimeInforce) {
		this.endTimeInforce = endTimeInforce;
	}

	public Date getStartTimeInforceToCheck() {
		return startTimeInforceToCheck;
	}

	public void setStartTimeInforceToCheck(Date startTimeInforceToCheck) {
		this.startTimeInforceToCheck = startTimeInforceToCheck;
	}

	public Date getEndTimeInforceToCheck() {
		return endTimeInforceToCheck;
	}

	public void setEndTimeInforceToCheck(Date endTimeInforceToCheck) {
		this.endTimeInforceToCheck = endTimeInforceToCheck;
	}

	public int getBreaksNumber() {
		return breaksNumber;
	}

	public void setBreaksNumber(int breaksNumber) {
		this.breaksNumber = breaksNumber;
	}

	public int getFirstBreakLength() {
		return firstBreakLength;
	}

	public void setFirstBreakLength(int firstBreakLength) {
		this.firstBreakLength = firstBreakLength;
	}

	public int getSecondBreakLength() {
		return secondBreakLength;
	}

	public void setSecondBreakLength(int secondBreakLength) {
		this.secondBreakLength = secondBreakLength;
	}

	public int getThirdBreakLength() {
		return thirdBreakLength;
	}

	public void setThirdBreakLength(int thirdBreakLength) {
		this.thirdBreakLength = thirdBreakLength;
	}

	public String getFirstBreakTime() {
		return firstBreakTime;
	}

	public void setFirstBreakTime(String firstBreakTime) {
		this.firstBreakTime = firstBreakTime;
	}

	public String getSecondBreakTime() {
		return secondBreakTime;
	}

	public void setSecondBreakTime(String secondBreakTime) {
		this.secondBreakTime = secondBreakTime;
	}

	public String getThirdBreakTime() {
		return thirdBreakTime;
	}

	public void setThirdBreakTime(String thirdBreakTime) {
		this.thirdBreakTime = thirdBreakTime;
	}

	public Date getStartPotentialDT() {
		return StartPotentialDT;
	}

	public void setStartPotentialDT(Date startPotentialDT) {
		StartPotentialDT = startPotentialDT;
	}

	public Date getEndPotentialDT() {
		return EndPotentialDT;
	}

	public void setEndPotentialDT(Date endPotentialDT) {
		EndPotentialDT = endPotentialDT;
	}

	public PotentialEmployeeBean[] getPotentialEmployeeBeans() {
		return potentialEmployeeBeans;
	}

	public void setPotentialEmployeeBeans(
			PotentialEmployeeBean[] potentialEmployeeBeans) {
		this.potentialEmployeeBeans = potentialEmployeeBeans;
	}

	
	public Vector getPotentialInforceData() {
		return potentialInforceData;
	}

	public void setPotentialInforceData(Vector potentialInforceData) {
		this.potentialInforceData = potentialInforceData;
	}

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
	public Date getStartPotential() {
		return StartPotential;
	}
	public void setStartPotential(Date startPotential) {
		StartPotential = startPotential;
	}
	public Date getEndPotential() {
		return EndPotential;
	}
	public void setEndPotential(Date endPotential) {
		EndPotential = endPotential;
	}
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public Date getDate() {
		return date;
	}
	public void setDate(Date date) {
		this.date = date;
	}
	public int getSkill() {
		return skill;
	}
	public void setSkill(int skill) {
		this.skill = skill;
	}
	public String getMoked() {
		return moked;
	}
	public void setMoked(String moked) {
		this.moked = moked;
	}
	public String getActivity() {
		return activity;
	}
	public void setActivity(String activity) {
		this.activity = activity;
	}
	public String getAction() {
		return action;
	}
	public void setAction(String action) {
		this.action = action;
	}
	public AgentDayBean[] getDays() {
		return days;
	}
	public void setDays(AgentDayBean[] days) {
		this.days = days;
	}
	public String[] getTeam() {
		return team;
	}
	public void setTeam(String[] team) {
		this.team = team;
	}
	public String[] getInnerJob() {
		return innerJob;
	}
	public void setInnerJob(String[] innerJob) {
		this.innerJob = innerJob;
	}

	public boolean isTrained() {
		return trained;
	}

	public void setTrained(boolean trained) {
		this.trained = trained;
	}

	public boolean isWorkFromHome() {
		return workFromHome;
	}

	public void setWorkFromHome(boolean workFromHome) {
		this.workFromHome = workFromHome;
	}

	public String getRemark() {
		return remark;
	}
	public void setRemark(String remark) {
		this.remark = remark;
	}
	public String[] getActivities() {
		return activities;
	}
	public void setActivities(String[] activities) {
		this.activities = activities;
	}
	public String getFirstName() {
		return firstName;
	}
	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}
	public String getLastName() {
		return lastName;
	}
	public void setLastName(String lastName) {
		this.lastName = lastName;
	}
	public int getMoreDetails() {
		return moreDetails;
	}
	public void setMoreDetails(int moreDetails) {
		this.moreDetails = moreDetails;
	}
	public void setFieldsMapping(HashMap fieldsMapping) {
		this.fieldsMapping = fieldsMapping;
	}

	public String[] getSelectedPotential() {
		return selectedPotential;
	}

	public void setSelectedPotential(String[] selectedPotential) {
		this.selectedPotential = selectedPotential;
	}

	public boolean isCategoryJob() {
		return categoryJob;
	}

	public void setCategoryJob(boolean categoryJob) {
		this.categoryJob = categoryJob;
	}
	
	
	public Integer getMaxLength() {
		return maxLength;
	}



	public void setMaxLength(Integer maxLength) {
		this.maxLength = maxLength;
	}



	public void copyForm(PotentialInforceForm other){
		this.date = other.getDate();
		this.moked=other.getMoked();
		this.team=other.getTeam();
		this.innerJob=other.getInnerJob();
		this.firstName = other.getFirstName();
		this.lastName = other.getLastName();
		this.trained = other.isTrained();
		this.workFromHome = other.isWorkFromHome();
		this.categoryJob = other.isCategoryJob();
		this.StartPotential = other.getStartPotential();
		this.EndPotential = other.getEndPotential();
	}
	
}
