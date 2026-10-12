/*
 * Created on 26/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CourseBean extends ShfBaseBean{
	
	protected int courseCode;
	protected String courseName;
	protected String teacherName;
	protected Date date_begin;
	protected Date date_end;
	protected String status;
	protected String remark;
	protected String place;
	
	
	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return null;
	}

	/**
	 * @return
	 */
	public int getCourseCode() {
		return courseCode;
	}

	/**
	 * @return
	 */
	public String getCourseName() {
		return courseName;
	}

	/**
	 * @return
	 */
	public Date getDate_begin() {
		return date_begin;
	}

	/**
	 * @return
	 */
	public Date getDate_end() {
		return date_end;
	}

	/**
	 * @return
	 */
	public String getRemark() {
		return remark;
	}

	/**
	 * @return
	 */
	public String getStatus() {
		return status;
	}

	/**
	 * @return
	 */
	public String getTeacherName() {
		return teacherName;
	}

	/**
	 * @param i
	 */
	public void setCourseCode(int i) {
		courseCode = i;
	}

	/**
	 * @param string
	 */
	public void setCourseName(String string) {
		courseName = string;
	}

	/**
	 * @param date
	 */
	public void setDate_begin(Date date) {
		date_begin = date;
	}

	/**
	 * @param date
	 */
	public void setDate_end(Date date) {
		date_end = date;
	}

	/**
	 * @param string
	 */
	public void setRemark(String string) {
		remark = string;
	}

	/**
	 * @param string
	 */
	public void setStatus(String string) {
		status = string;
	}

	/**
	 * @param string
	 */
	public void setTeacherName(String string) {
		teacherName = string;
	}

}
