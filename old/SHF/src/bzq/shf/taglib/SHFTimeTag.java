/*
 * Created on 13/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import java.util.Date;

import javax.servlet.ServletContext;
import javax.servlet.jsp.JspException;

import org.apache.struts.util.RequestUtils;
import org.apache.struts.util.ResponseUtils;

import bzq.taglib.BaseHandlerTag;
import bzq.taglib.Constants;
import bzq.utils.BaseConvert;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SHFTimeTag extends BaseHandlerTag{
	
	protected Date date;
	protected String pattern;
	protected String orderBy;
	protected String name;
	protected String property;
	
	public int doStartTag() throws JspException {

		StringBuffer results = new StringBuffer();
		if(name!=null && property!=null){
			date = (Date)RequestUtils.lookup(pageContext, name, property,"page" );
		}
		if (pattern==null)
			pattern ="HH:mm";
		
		if(orderBy==null)
			orderBy="HHmm";
			
		//String str=BaseConvert.dateToString(date,orderBy);
		
		results.append(BaseConvert.dateToString(date, pattern ));
		ResponseUtils.write(pageContext, results.toString());
		pageContext.setAttribute(Constants.SELECT_KEY, this);
		return (SKIP_BODY);
	}
	
	
	/**
	 * @return
	 */
	public String getPattern() {
		return pattern;
	}

	/**
	 * @param string
	 */
	public void setPattern(String string) {
		pattern = string;
	}

	/**
	 * @return
	 */
	public Date getDate() {
		return date;
	}

	/**
	 * @param date
	 */
	public void setDate(Date date) {
		this.date = date;
	}

	/**
	 * @return
	 */
	public String getOrderBy() {
		return orderBy;
	}

	/**
	 * @param string
	 */
	public void setOrderBy(String string) {
		orderBy = string;
	}


	public String getName() {
		return name;
	}


	public void setName(String name) {
		this.name = name;
	}


	public String getProperty() {
		return property;
	}


	public void setProperty(String property) {
		this.property = property;
	}

}
