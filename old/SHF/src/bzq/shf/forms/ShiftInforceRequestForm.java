/*
 * Created on 01/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.InnerJobBean;
import bzq.shf.bean.OrgUnitBean;
import bzq.shf.bean.ShfBaseBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftInforceRequestForm extends ShfBaseBean{

	private static HashMap fieldsMapping;
	static{
		fieldsMapping=new HashMap();
		fieldsMapping.put("SHIFT_INFORCE_ID","id");
		fieldsMapping.put("SHIFT_DATE","date");
		fieldsMapping.put("SHIFT_START","shiftStart");
		fieldsMapping.put("SHIFT_END","shiftEnd");
		fieldsMapping.put("AGENTS_NUMBER","numOfAgents");
		fieldsMapping.put("ORIGINAL_AGENTS_NUMBER","originalNumOfAgents");
		fieldsMapping.put("SKILL_ID","skill");
		fieldsMapping.put("MOKED_ID","moked");
		fieldsMapping.put("MODIFICATION_USER","user");
		fieldsMapping.put("ACTIVITY_TYPE_ID","activity");
		fieldsMapping.put("CREATION_TIME","creationTime");
		fieldsMapping.put("MODIFICATION_TIME","modificationTime");
		fieldsMapping.put("BREAKS_NUMBER","breaksNumber");
		fieldsMapping.put("FIRST_BREAK_TIME","firstBreakTime");
		fieldsMapping.put("FIRST_BREAK_LENGTH","firstBreakLength");
		fieldsMapping.put("SECOND_BREAK_TIME","secondBreakTime");
		fieldsMapping.put("SECOND_BREAK_LENGTH","secondBreakLength");
		fieldsMapping.put("THIRD_BREAK_TIME","thirdBreakTime");
		fieldsMapping.put("THIRD_BREAK_LENGTH","thirdBreakLength");
		fieldsMapping.put("ADDED_SHIFTS_NUM","addedShiftsNum");
		fieldsMapping.put("REMARK","remark");
		fieldsMapping.put("TRADITIONAL","trained");
		fieldsMapping.put("WORK_FROM_HOME","workFromHome");
		fieldsMapping.put("JOB_CATAGORY_TYPE","categoryJob");
	}
	
	private int id;
	private Date date;
	private Date shiftStart;
	private Date shiftEnd;
	private int numOfAgents;
	private int originalNumOfAgents;
	private int skill;
	private String user;
	private Date creationTime;
	private Date modificationTime;
	private String moked;
	private String activity;
	private int breaksNumber;
	private int firstBreakLength;
	private int secondBreakLength;
	private int thirdBreakLength;
	private String firstBreakTime;
	private String secondBreakTime;
	private String thirdBreakTime;
	
	private String action;
	private AgentDayBean[] days;
	private int addedShiftsNum;
	private String[] team;
	private String[] innerJob;
	private int trained;
	private int categoryJob;
	private int workFromHome;
	private String remark;
	private String[]activities ;
	private String firstName;
	private String LastName;
	private int moreDetails;
	private Date StartPotential =  null;
	private Date EndPotential = null;
	
	protected OrgUnitBean[] orgUnitBean;
	protected InnerJobBean[] innerJobBean;
	protected String[] teamNumber;
	protected int[] innerJobNumber;

	
	
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}


	/**
	 * @return
	 */
	public int getNumOfAgents() {
		return numOfAgents>0?numOfAgents:0;
	}

	/**
	 * @return
	 */
	public Date getShiftEnd() {
		return shiftEnd;
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


	/**
	 * @return
	 */
	public Date getShiftStart() {
		return shiftStart;
	}

	/**
	 * @return
	 */
	public int getSkill() {
		return skill;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}


	/**
	 * @param i
	 */
	public void setNumOfAgents(int i) {
		numOfAgents = i;
	}

	/**
	 * @param date
	 */
	public void setShiftEnd(Date date) {
		shiftEnd = date;
	}

	/**
	 * @param date
	 */
	public void setShiftStart(Date date) {
		shiftStart = date;
	}

	/**
	 * @param i
	 */
	public void setSkill(int i) {
		skill = i;
	}

	/**
	 * @return
	 */
	public Date getCreationTime() {
		return creationTime;
	}

	/**
	 * @return
	 */
	public int getId() {
		return id;
	}

	/**
	 * @return
	 */
	public String getUser() {
		return user;
	}

	/**
	 * @param date
	 */
	public void setCreationTime(Date date) {
		creationTime = date;
	}

	/**
	 * @param i
	 */
	public void setId(int i) {
		id = i;
	}

	/**
	 * @param string
	 */
	public void setUser(String string) {
		user = string;
	}

	/**
	 * @return
	 */
	public String getAction() {
		return action;
	}

	/**
	 * @param string
	 */
	public void setAction(String string) {
		action = string;
	}

	/**
	 * @return
	 */
	public int getOriginalNumOfAgents() {
		return originalNumOfAgents;
	}

	/**
	 * @param i
	 */
	public void setOriginalNumOfAgents(int i) {
		originalNumOfAgents = i;
	}

	/**
	 * @return
	 */
	public AgentDayBean[] getDays() {
		return days;
	}

	/**
	 * @param beans
	 */
	public void setDays(AgentDayBean[] beans) {
		days = beans;
	}

	
	
	/**
	 * @return
	 */
	public Date getDate() {
		return date;
	}

	/**
	 * @param string
	 */
	public void setDate(Date d) {
		date = d;
	}

	/**
	 * @return
	 */
	public Date getModificationTime() {
		return modificationTime;
	}

	/**
	 * @param date
	 */
	public void setModificationTime(Date date) {
		modificationTime = date;
	}

	/**
	 * @return
	 */
	public String getMoked() {
		return moked;
	}

	/**
	 * @param string
	 */
	public void setMoked(String string) {
		moked = string;
	}

	/**
	 * @return
	 */
	public String getActivity() {
		return activity;
	}

	/**
	 * @param i
	 */
	public void setActivity(String i) {
		activity = i;
	}

	/**
	 * @return
	 */
	public int getBreaksNumber() {
		return breaksNumber;
	}

	/**
	 * @return
	 */
	public int getFirstBreakLength() {
		return firstBreakLength;
	}

	

	/**
	 * @return
	 */
	public int getSecondBreakLength() {
		return secondBreakLength;
	}

	

	/**
	 * @return
	 */
	public int getThirdBreakLength() {
		return thirdBreakLength;
	}

	

	/**
	 * @param i
	 */
	public void setBreaksNumber(int i) {
		breaksNumber = i;
	}

	/**
	 * @param i
	 */
	public void setFirstBreakLength(int i) {
		firstBreakLength = i;
	}

	

	/**
	 * @param i
	 */
	public void setSecondBreakLength(int i) {
		secondBreakLength = i;
	}

	

	/**
	 * @param i
	 */
	public void setThirdBreakLength(int i) {
		thirdBreakLength = i;
	}

	

	/**
	 * @return
	 */
	public String getFirstBreakTime() {
		return firstBreakTime;
	}

	/**
	 * @return
	 */
	public String getSecondBreakTime() {
		return secondBreakTime;
	}

	/**
	 * @return
	 */
	public String getThirdBreakTime() {
		return thirdBreakTime;
	}

	/**
	 * @param string
	 */
	public void setFirstBreakTime(String string) {
		firstBreakTime = string;
	}

	/**
	 * @param string
	 */
	public void setSecondBreakTime(String string) {
		secondBreakTime = string;
	}

	/**
	 * @param string
	 */
	public void setThirdBreakTime(String string) {
		thirdBreakTime = string;
	}

	/**
	 * @return
	 */
	public int getAddedShiftsNum() {
		return addedShiftsNum;
	}

	/**
	 * @param i
	 */
	public void setAddedShiftsNum(int i) {
		addedShiftsNum = i;
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


	public int getTrained() {
		return trained;
	}


	public void setTrained(int trained) {
		this.trained = trained;
	}


	public int getCategoryJob() {
		return categoryJob;
	}


	public void setCategoryJob(int categoryJob) {
		this.categoryJob = categoryJob;
	}


	public int getWorkFromHome() {
		return workFromHome;
	}


	public void setWorkFromHome(int workFromHome) {
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
		return LastName;
	}


	public void setLastName(String lastName) {
		LastName = lastName;
	}


	public int getMoreDetails() {
		return moreDetails;
	}


	public void setMoreDetails(int moreDetails) {
		this.moreDetails = moreDetails;
	}


	public OrgUnitBean[] getOrgUnitBean() {
		return orgUnitBean;
	}


	public void setOrgUnitBean(OrgUnitBean[] orgUnitBean) {
		this.orgUnitBean = orgUnitBean;
	}


	public InnerJobBean[] getInnerJobBean() {
		return innerJobBean;
	}


	public void setInnerJobBean(InnerJobBean[] innerJobBean) {
		this.innerJobBean = innerJobBean;
	}


	public String[] getTeamNumber() {
		return teamNumber;
	}


	public void setTeamNumber(String[] teamNumber) {
		this.teamNumber = teamNumber;
	}


	public int[] getInnerJobNumber() {
		return innerJobNumber;
	}


	public void setInnerJobNumber(int[] innerJobNumber) {
		this.innerJobNumber = innerJobNumber;
	}


	

	
	
	


	
	
}
