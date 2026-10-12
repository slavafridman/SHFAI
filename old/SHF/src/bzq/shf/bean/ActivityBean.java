/*
 * Created on 27/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.HashMap;
import java.util.Vector;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ActivityBean {
	private String activityCode;
	private String activityDesc;
	private int activitySum=0;
	private int arrivedSum;
	private int missSum;
	private int notRegisterSum;
	private Vector vDayBean = new Vector(10);
	private HashMap HSkillsBean = new HashMap();
	
	/**
	 * 
	 */
	public ActivityBean() {
		super();
		
	}

	/**
	 * @return
	 */
	public String getActivityCode() {
		return activityCode;
	}

	/**
	 * @return
	 */
	public String getActivityDesc() {
		return activityDesc;
	}

	/**
	 * @param string
	 */
	public void setActivityCode(String string) {
		activityCode = string;
	}

	/**
	 * @param string
	 */
	public void setActivityDesc(String string) {
		activityDesc = string;
	}

	/**
	 * @return
	 */
	public int getActivitySum() {
		return activitySum;
	}

	/**
	 * @param i
	 */
	public void setActivitySum(int i) {
		activitySum = i;
	}

	
	public void addToVDayBean(AgentDayBean dayBean){
		vDayBean.add(dayBean);
	}

	/**
	 * @return
	 */
	public Vector getVDayBean() {
		return vDayBean;
	}

	/**
	 * @return
	 */
	public HashMap getHSkillsBean() {
		return HSkillsBean;
	}

	/**
	 * @param map
	 */
	public void setHSkillsBean(HashMap map) {
		HSkillsBean = map;
	}

	/**
	 * @return
	 */
	public int getArrivedSum() {
		return arrivedSum;
	}

	/**
	 * @return
	 */
	public int getMissSum() {
		return missSum;
	}

	/**
	 * @return
	 */
	public int getNotRegisterSum() {
		return notRegisterSum;
	}

	/**
	 * @param i
	 */
	public void setArrivedSum(int i) {
		arrivedSum = i;
	}

	/**
	 * @param i
	 */
	public void setMissSum(int i) {
		missSum = i;
	}

	/**
	 * @param i
	 */
	public void setNotRegisterSum(int i) {
		notRegisterSum = i;
	}
	
	public void incrementNotRegisterSum(int add){
		notRegisterSum=notRegisterSum+add;
	}
	public void incrementMissSum(int add){
		missSum=missSum+add;
	}
	public void incrementArrivedSum(int add){
		arrivedSum=arrivedSum+add;
	}

}
